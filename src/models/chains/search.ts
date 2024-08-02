import { BaseLanguageModel } from 'langchain/base_language'
import { Tool } from 'langchain/tools'
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { ChainInputs, BaseChain, ConversationChain } from 'langchain/chains'
import { Generation, ChatGeneration } from 'langchain/schema'
import { ChainTool } from 'langchain/tools'
import { CallbackManager, CallbackManagerForChainRun } from 'langchain/callbacks'
import { ChainValues } from 'langchain/schema'
import { uniq, cloneDeep, isEmpty } from 'lodash'
import { BaseChatMemory, BufferWindowMemory } from 'langchain/memory'
import { config } from '../../../package.json'
import { ReadOnlyBufferWindowMemory } from '../utils/memory'
import { OutputActionParser } from '../utils/parsers'
import { ClarificationActionResponse, ErrorActionResponse, SearchActionResponse } from '../utils/actions'
import { ZoteroCallbacks } from '../utils/callbacks'
import { SimplifiedStates, serializeStates } from '../utils/states'
import * as zot from '../../apis/zotero'

type SearchMode = 'search' | 'qa'

export async function searchZotero(
  query: SearchActionResponse['payload'],
  zoteroCallbacks: ZoteroCallbacks,
  mode: SearchMode,
  collectionIDs?: number[]
) {
  const length = mode === 'search' ? 25 : 5
  if (!query.years || isEmpty(query.years)) {
    query.years = { from: currentYear - 4, to: currentYear }
  }
  if (query.years.from === 0 || query.years.from === null) {
    query.years.from = currentYear - 4
  }
  if (query.years.to === 0 || query.years.to === null) {
    query.years.to = currentYear
  }
  if (query.years.from > query.years.to) {
    ;[query.years.from, query.years.to] = [query.years.to, query.years.from]
  }
  const { handleZoteroActionStart, handleZoteroActionEnd } = zoteroCallbacks
  handleZoteroActionStart('🔎 Searching Zotero database')
  const { count, results, collections } = await zot.search({ ...query, length, collectionIDs })
  handleZoteroActionEnd('✅ Search complete')
  return { count, query, results, collections }
}

const SEARCH_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `
Compose an exhaustive search query for Zotero that includes broader, narrower, and associated terms to ensure a more extensive search coverage.

Gather the following information from the user in a conversational manner:
- A set of keywords to represent a specific topic or question. Keywords should be domain specific terminologies and should not include common phrases such as "papers", "articles", "summary", "research areas" etc. It is possible that a search query does not include any keywords.
- Creators
- Tags
- Collections
- Year range
We need one, or a combination of multiple of the above to build a search query.

If you don't have enough information, or are unclear about user's intention, ask for clarification.
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

const currentYear = new Date().getFullYear()

const functions = [
  {
    name: 'search_',
    description: `Define an action to route a user's request. Output the action name in the "action" field and the payload for the action in the "payload" field.`,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action to take, either building a serach query or asking for clarification',
          enum: ['search', 'clarification'],
        },
        payload: {
          oneOf: [
            {
              type: 'object',
              properties: {
                keywords: {
                  type: 'array',
                  description:
                    'Keywords to search for in the Zotero database, based on the question or topic provided by the user. Keywords should be domain specific terminologies and should not include common phrases such as "paper", "article", "summary" etc. For each keyword, include broader, narrower and other relevant terms.',
                  items: {
                    type: 'string',
                  },
                },
                creators: {
                  type: 'array',
                  description: 'Creators (authors, editors) to search for in the Zotero database.',
                  items: {
                    type: 'string',
                  },
                },
                tags: {
                  type: 'array',
                  description:
                    'Tags to search for in the Zotero database. Only populate this field if the user has specifically mentioned tags in their message.',
                  items: {
                    type: 'string',
                  },
                },
                years: {
                  type: 'object',
                  description: `Year range to search for in the Zotero database. For example, a reasonable year range is from ${currentYear - 3
                    } to ${currentYear}. Do not populate this field if the user has not specifically mentioned year range in their message.`,
                  properties: {
                    from: {
                      type: 'integer',
                      minimum: 1900,
                      maximum: currentYear,
                      description: 'The starting year of the range.',
                    },
                    to: {
                      type: 'integer',
                      minimum: 1900,
                      maximum: currentYear,
                      description: 'The ending year of the range.',
                    },
                  },
                },
                collections: {
                  type: 'array',
                  description: 'Collections to search for in the Zotero database.',
                  items: {
                    type: 'number',
                  },
                },
              },
              required: [],
            },
            {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'The message to ask for user clarification on the search strategy.',
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

export interface SearchChainInput extends ChainInputs {
  llm: BaseLanguageModel
  prompt?: ChatPromptTemplate
  inputKey?: string
  outputKey?: string
  langChainCallbackManager?: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
  memory: BaseChatMemory
  mode: SearchMode
}

export class SearchChain extends BaseChain {
  // LLM wrapper to use
  llm: BaseLanguageModel
  memory: BaseChatMemory
  prompt = SEARCH_DEFAULT_PROMPT
  inputKey = 'input'
  outputKey = 'output'
  mode: SearchMode = 'search'
  langChainCallbackManager: CallbackManager | undefined
  zoteroCallbacks: ZoteroCallbacks
  tags = ['zotero', 'zotero-search']

  constructor(fields: SearchChainInput) {
    super(fields)
    this.llm = fields.llm
    this.memory = fields.memory
    this.langChainCallbackManager = fields.langChainCallbackManager
    this.zoteroCallbacks = fields.zoteroCallbacks
    this.inputKey = fields.inputKey ?? this.inputKey
    this.outputKey = fields.outputKey ?? this.outputKey
    this.prompt = fields.prompt ?? this.prompt
    this.mode = fields.mode ?? this.mode
  }

  /** @ignore */
  async _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
    const outputParser = new OutputActionParser()
    // console.log(JSON.stringify((this.memory?.chatHistory as any).messages, null, 2))
    const llmChain = new ConversationChain({
      llm: this.llm,
      prompt: this.prompt,
      memory: new ReadOnlyBufferWindowMemory(this.memory),
      llmKwargs: {
        functions,
        function_call: { name: 'search_' }, // 'search', change to 'search_' for being compatible with the qwen model.
        // qwen reserve 'search' word for other usage. Ref: PR[#112]
        // TODO: Put chain metadata here until it is officially supported
        key: 'search-chain',
        title: '🛠️ Building search query',
      } as any,
      outputParser,
      callbackManager: this.langChainCallbackManager,
      outputKey: this.outputKey,
    })
    const { collections: collectionIDs } = (values.relevantStates || {}) as SimplifiedStates
    const output = await llmChain.call({ ...values, states: serializeStates(values.relevantStates) })
    const { action, payload } = JSON.parse(output[this.outputKey]) as
      | SearchActionResponse
      | ClarificationActionResponse
      | ErrorActionResponse
    if (action === 'clarification' || action === 'error') {
      return output
    }
    const searchQuery = payload as SearchActionResponse['payload']
    // console.log({ states: values.states, searchQuery })
    const { query, count, results, collections } = await searchZotero(
      searchQuery,
      this.zoteroCallbacks,
      this.mode,
      collectionIDs
    )
    return {
      [this.outputKey]: JSON.stringify({
        action,
        payload: { widget: 'SEARCH_RESULTS', input: { query, count, results, collections } },
      }),
    }
  }

  _chainType() {
    return 'search_chain' as const
  }

  get inputKeys(): string[] {
    return [this.inputKey]
  }

  get outputKeys(): string[] {
    return [this.outputKey]
  }
}

interface LoadSearchChainInput {
  prompt?: ChatPromptTemplate
  langChainCallbackManager: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
  memory: BaseChatMemory
  mode: SearchMode
}

export const loadSearchChain = (params: LoadSearchChainInput) => {
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
  const { prompt = SEARCH_DEFAULT_PROMPT, langChainCallbackManager, zoteroCallbacks, memory, mode } = params
  const chain = new SearchChain({ prompt, memory, llm, langChainCallbackManager, zoteroCallbacks, mode })
  return chain
}

// export const loadZoteroQueryBuilderChainAsTool = (
//   llm: BaseLanguageModel,
//   params: ZoteroQueryBuilderChainParams = {}
// ) => {
//   return new ChainTool({
//     name: 'zotero-query-builder',
//     description:
//       'Useful for converting a search request or a topic into a query and then search for results in Zotero library. The input to this tool should be a string representing a question such as "how to use machine learning for drug discovery?".',
//     chain: loadZoteroQueryBuilderChain(params),
//   })
// }
