import { BaseLanguageModel } from 'langchain/base_language'
import { Tool } from 'langchain/tools'
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts'
import { ChatOpenAI } from 'langchain/chat_models'
import { ChainInputs, BaseChain, ConversationChain } from 'langchain/chains'
import { Generation, ChatGeneration } from 'langchain/schema'
import { ChainTool } from 'langchain/tools'
import { CallbackManager, CallbackManagerForChainRun } from 'langchain/callbacks'
import { ChainValues } from 'langchain/schema'
import { uniq, cloneDeep, isEmpty } from 'lodash'
import { BaseChatMemory, BufferWindowMemory } from 'langchain/memory'
import { config } from '../../../package.json'
import { ReadOnlyBufferWindowMemory } from '../utils/memory'
import { OPENAI_GPT_MODEL } from '../../constants'
import { OutputActionParser } from '../utils/parsers'
import { ClarificationActionResponse, ErrorActionResponse, SearchActionResponse } from '../utils/actions'
import { ZoteroCallbacks } from '../utils/callbacks'

type SearchMode = 'search' | 'qa'

export async function searchZotero(
  query: SearchActionResponse['payload'],
  zoteroCallbacks: ZoteroCallbacks,
  mode: SearchMode
) {
  const length = mode === 'search' ? 25 : 5
  if (isEmpty(query.years) || query.years.from === 0 || query.years.to === 0) {
    query.years = { from: currentYear - 4, to: currentYear }
  }
  if (query.years.from > query.years.to) {
    ;[query.years.from, query.years.to] = [query.years.to, query.years.from]
  }
  const { keywords = [], authors = [], tags = [], years } = query
  const { handleZoteroActionStart, handleZoteroActionEnd } = zoteroCallbacks
  handleZoteroActionStart('🔎 Searching Zotero database')
  const s = new Zotero.Search()
  s.addCondition('itemType', 'isNot', 'attachment')
  authors.forEach(author => author.split(' ').forEach(word => s.addCondition('creator', 'contains', word)))
  tags.forEach(tag => s.addCondition('tag', 'is', tag))
  years.from && s.addCondition('date', 'isAfter', `${years.from - 1}`)
  years.to && s.addCondition('date', 'isBefore', `${years.to + 1}`)
  let ids: number[] = []
  if (keywords.length > 0) {
    for (let keyword of keywords) {
      const sKw = cloneDeep(s)
      sKw.addCondition('quicksearch-everything', 'contains', keyword)
      const result = await sKw.search()
      ids = [...ids, ...result]
    }
  } else {
    s.addCondition('quicksearch-everything', 'contains', '')
    ids = await s.search()
  }

  ids = uniq(ids)
  const items = await Promise.all(
    ids.slice(0, length).map(async id => {
      return await Zotero.Items.getAsync(id)
    })
  )
  const results = items.map(item => {
    const id = item.id
    const title = item.getDisplayTitle()
    const creators = item.getCreators()
    const authors =
      creators.length === 0
        ? undefined
        : creators.length > 1
        ? `${creators[0].lastName} et al.`
        : `${creators[0].firstName} ${creators[0].lastName}`
    const itemType = item.itemType
    const year = new Date(item.getField('date') as string).getFullYear()
    if (mode === 'search') {
      return { id, title, authors, itemType, year }
    }
    const abstract = item.getField('abstractNote', false, true) || ''
    return { id, title, authors, itemType, year, abstract }
  })
  handleZoteroActionEnd('✅ Search complete')
  return { count: ids.length, query, results }
}

const SEARCH_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `
Compose an exhaustive search query for Zotero that includes broader, narrower, and associated terms to ensure a more extensive search coverage.
Gather the following information from the user in a conversational manner:
- A specific topic (required)
- Authors (optional)
- Tags (optional)
- Year range (optional)
If you don't have the information, ask for clarification.
    `.trim()
  ),
  new MessagesPlaceholder('history'),
  HumanMessagePromptTemplate.fromTemplate(
    `
<< INPUT >>
{input}

<< OUTPUT >>
    `.trim()
  ),
])

const currentYear = new Date().getFullYear()

const functions = [
  {
    name: 'search',
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
                    'Keywords to search for in the Zotero database. For each keyword, include broader, narrower and other relevant terms.',
                  items: {
                    type: 'string',
                  },
                },
                authors: {
                  type: 'array',
                  description: 'Authors to search for in the Zotero database.',
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
                  description: `Year range to search for in the Zotero database. For example, a reasonable year range is from 2020 to ${currentYear}. Do not populate this field if the user has not specifically mentioned year range in their message.`,
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
              },
              required: ['keywords'],
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

  // Prompt to use to create search query.
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
        function_call: { name: 'search' },
        // TODO: Put chain metadata here until it is officially supported
        key: 'search-chain',
        title: '🛠️ Building search query',
      } as any,
      outputParser,
      callbackManager: this.langChainCallbackManager,
      outputKey: this.outputKey,
    })

    const question: string = values[this.inputKey]

    const output = await llmChain.call({ [this.inputKey]: question })
    const { action, payload } = JSON.parse(output[this.outputKey]) as
      | SearchActionResponse
      | ClarificationActionResponse
      | ErrorActionResponse
    if (action === 'clarification' || action === 'error') {
      return output
    }
    const searchQuery = payload as SearchActionResponse['payload']
    const { query, count, results } = await searchZotero(searchQuery, this.zoteroCallbacks, this.mode)
    return {
      [this.outputKey]: JSON.stringify({
        action,
        payload: { widget: 'SEARCH_RESULTS', input: { query, count, results } },
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
  const OPENAI_API_KEY = Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string
  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
    modelName: OPENAI_GPT_MODEL,
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
