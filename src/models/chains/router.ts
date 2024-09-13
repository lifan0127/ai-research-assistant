import { BaseLanguageModel } from 'langchain/base_language'
import { AgentExecutor } from 'langchain/agents'
import { BaseChain } from 'langchain/chains'
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { JsonOutputFunctionsParser, OutputFunctionsParser } from 'langchain/output_parsers'
import { ConversationChain } from 'langchain/chains'
import { BaseChatMemory } from 'langchain/memory'
import { ChainValues } from 'langchain/schema'
import { StructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers'
import { config } from '../../../package.json'
import { ChatOpenAI } from '@langchain/openai'
import { create } from 'domain'
import { CallbackManager, CallbackManagerForChainRun } from 'langchain/callbacks'
import { ClarificationActionResponse, RoutingActionResponse, ExecutorActionResponse } from '../utils/actions'
import { OutputActionParser } from '../utils/parsers'
import { serializeStates } from '../utils/states'

const OPENAI_API_KEY = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string) || 'YOUR_OPENAI_API_KEY'
const OPENAI_MODEL = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || 'gpt-4o'
const OPENAI_BASE_URL =
  (Zotero.Prefs.get(`${config.addonRef}.OPENAI_BASE_URL`) as string) || 'https://api.openai.com/v1'
const llm = new ChatOpenAI({
  temperature: 0,
  openAIApiKey: OPENAI_API_KEY,
  modelName: OPENAI_MODEL,
  configuration: {
    baseURL: OPENAI_BASE_URL,
  },
})

export interface Routes {
  [key: string]: {
    description: string
    executor: BaseChain | AgentExecutor
  }
}

export interface RouteFunction {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: {
      [route: string]: any
    }
    required?: string[]
  }
}

export function createRouteFunctions(routes: Routes): RouteFunction[] {
  const functions = [
    {
      name: 'routing',
      description: `Define an action to route a user's request. Output the action name in the "action" field and the payload for the action in the "payload" field.`,
      parameters: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            description: 'The action to take, either routing to a specific route or asking for clarification.',
            enum: ['routing', 'clarification'],
          },
          payload: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  route: {
                    type: 'string',
                    description: `
                  The name of the executor to handle the request. Must be one of the following:\n${Object.entries(
                    routes
                  )
                    .map(([key, value]) => `- ${key}: ${value.description}`)
                    .join('\n')}
                  `.trim(),
                    enum: Object.keys(routes),
                  },
                  input: {
                    type: 'string',
                    description:
                      'The original user message, or a potentially modified version tailored for the route. It should not duplicate the existing information in the application states.',
                  },
                  states: {
                    type: 'object',
                    description: 'A subset of the application states relevant to the user message.',
                    properties: {
                      creators: {
                        type: 'array',
                        description:
                          'Creators (authors, editors) of the items in the Zotero library, useful for refining search scope.',
                        items: {
                          type: 'string',
                        },
                      },
                      tags: {
                        type: 'array',
                        description: 'Tags of the items in the Zotero library, useful for refining search scope.',
                        items: {
                          type: 'string',
                        },
                      },
                      items: {
                        type: 'array',
                        description: 'Zotero Item IDs, useful as sources for Q&A.',
                        items: {
                          type: 'number',
                        },
                      },
                      collections: {
                        type: 'array',
                        description: 'Zotero Collection IDs, useful for refining search scope.',
                        items: {
                          type: 'number',
                        },
                      },
                      images: {
                        type: 'array',
                        description: 'Images provided by the user related to their question',
                        items: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
                required: ['route', 'input'],
              },
              {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'The message to ask for user clarification or missing information.',
                  },
                },
                required: ['message'],
              },
            ],
          },
        },
        required: ['action', 'payload'],
      },
    },
  ]
  return functions
}

const DEFAULT_ROUTE_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `
You are an AI assistant for Zotero, a reference management software.
Your job is to analyze a user's request, in the context of the application states, and choose the appropriate follow-up actions.

Requirements:
- You should interpret the user request in the context of the application states, which include a set of creators, tags, items and collections selected by the user.
- When you cannot confidently determine the user's intention, the action should be "clarification" and the payload should contain a message to politely express your doubt. The goal is have the user provide more information through conversation.
- After you have gathered enough information to understood the user's intention, the action should be "routing" and the payload should contain the name of the route to handle the request, the input for the route, and optionally, the relevant application states. The name of the route must be one of the values provided to you. The input could be a potentially modified version of the original user message.
  `.trim()
  ),
  new MessagesPlaceholder('history'),
  HumanMessagePromptTemplate.fromTemplate(
    `
{states}

User Input: {input}
  `.trim()
  ),
])

export class RouterChain extends ConversationChain {
  /** @ignore */
  async _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
    const states = serializeStates(values.states)
    return super._call({ ...values, states }, runManager)
  }
}

interface createRouterInput {
  prompt?: ChatPromptTemplate
  memory: BaseChatMemory
  functions: RouteFunction[]
  callbackManager: CallbackManager
}

export const createRouter = ({
  prompt = DEFAULT_ROUTE_PROMPT,
  memory,
  functions,
  callbackManager,
}: createRouterInput) => {
  const outputParser = new OutputActionParser()
  const chain = new RouterChain({
    llm,
    prompt,
    memory,
    llmKwargs: {
      functions,
      function_call: { name: 'routing' },
      // TODO: Put chain metadata here until it is officially supported
      key: 'router-chain',
      title: '🚀 Routing Your Request',
    } as any,
    outputParser,
    outputKey: 'output',
    callbackManager,
    // verbose: true,
    tags: ['router'],
  })
  return chain
}
