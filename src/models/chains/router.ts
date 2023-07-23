import { BaseLanguageModel } from 'langchain/base_language'
import { AgentExecutor } from 'langchain/agents'
import { BaseChain } from 'langchain/chains'
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts'
import { JsonOutputFunctionsParser, OutputFunctionsParser } from 'langchain/output_parsers'
import { ConversationChain } from 'langchain/chains'
import { BaseChatMemory } from 'langchain/memory'
import { Generation, ChatGeneration } from 'langchain/schema'
import { StructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers'
import { config } from '../../../package.json'
import { ChatOpenAI } from 'langchain/chat_models'
import { create } from 'domain'
import { CallbackManager } from 'langchain/callbacks'
import { ClarificationActionResponse, RoutingActionResponse, ExecutorActionResponse } from '../utils/actions'
import { OutputActionParser } from '../utils/parsers'
import { OPENAI_GPT_MODEL } from '../../constants'

const OPENAI_API_KEY = Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string

const llm = new ChatOpenAI({
  temperature: 0,
  openAIApiKey: OPENAI_API_KEY,
  modelName: OPENAI_GPT_MODEL,
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
                    description: 'A potentially modified version of the original user message for the route.',
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
You are a helpful AI assistant for Zotero, a free and open-source reference management software.
Your job is to analyze a user's request and use the routing function to invoke follow-up actions.
- When you cannot confidently determine the user's intention, the action should be "clarification" and the payload should contain the message to politely ask for user clarification. This will trigger the user to provide more information through conversation.
- After you have gathered enough information to understood the user's intention, the action should be "routing" and the payload should contain the name of the agent to handle the request and the input for the agent, which could be a potentially modified version of the original user message. 
  `.trim()
  ),
  new MessagesPlaceholder('history'),
  HumanMessagePromptTemplate.fromTemplate(
    `
    {history}
    << INPUT >>
    {input}

    << OUTPUT >>
  `.trim()
  ),
])

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
  const chain = new ConversationChain({
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
  })
  return chain
}
