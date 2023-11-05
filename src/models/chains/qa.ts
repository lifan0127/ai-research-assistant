import { BaseLanguageModel } from 'langchain/base_language'
import { CallbackManager, CallbackManagerForChainRun } from 'langchain/callbacks'
import { BaseChain, ChainInputs, ConversationChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models'
import { BaseChatMemory } from 'langchain/memory'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from 'langchain/prompts'
import { ChainValues } from 'langchain/schema'
import retry, { Options } from 'async-retry'
import { config } from '../../../package.json'
import { OPENAI_GPT_MODEL } from '../../constants'
import { ClarificationActionResponse, ErrorActionResponse, QAActionResponse } from '../utils/actions'
import { ZoteroCallbacks } from '../utils/callbacks'
import { ReadOnlyBufferWindowMemory } from '../utils/memory'
import { OutputActionParser } from '../utils/parsers'
import { loadSearchChain, SearchChain } from './search'
import * as zot from '../../apis/zotero'

// // Prompt credit: https://github.com/whitead/paper-qa/blob/main/paperqa/qaprompts.py
const QA_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `
Write an answer for the question below solely based on the provided documents as sources.

If the question is not clear, ask for clarification. If no document is provided or the information is insufficient, say you cannot answer based on the user's Zotero library. DO NOT MAKE UP AN ANSWER.

Answer in a concise, unbiased and scholarly tone. Include the item ID(s) of the document(s) in the "sources" field to support the answer. Do not include the item ID(s) in the answer itself.
    `
  ),
  new MessagesPlaceholder('history'),
  HumanMessagePromptTemplate.fromTemplate(
    `
Context:
{context}

Question: {input}
Answer:
  `.trim()
  ),
])

const functions = [
  {
    name: 'qa',
    description: 'Answer a question based on the provided context.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action to take, either answer the question or asking for clarification',
          enum: ['qa', 'clarification'],
        },
        payload: {
          oneOf: [
            {
              type: 'object',
              properties: {
                answer: {
                  type: 'string',
                  description:
                    'The answer to the question. If necessary, use paragraphs, bullet points and/or table in Markdown format. Do not include item IDs here.',
                },
                sources: {
                  type: 'array',
                  description: 'The ID(s) of the document(s) to support the answer.',
                  items: {
                    type: 'string',
                  },
                },
              },
              required: ['answer'],
            },
            {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description:
                    'The message to ask for user clarification if the question cannot be answered based on the chat history.',
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

export interface QAChainInput extends ChainInputs {
  llm: BaseLanguageModel
  prompt?: ChatPromptTemplate
  inputKey?: string
  outputKey?: string
  langChainCallbackManager?: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
  memory: BaseChatMemory
}

export class QAChain extends BaseChain {
  // LLM wrapper to use
  llm: BaseLanguageModel

  memory: BaseChatMemory

  // Prompt to use to create search query.
  prompt = QA_DEFAULT_PROMPT

  inputKey = 'input'
  outputKey = 'output'

  langChainCallbackManager: CallbackManager | undefined

  zoteroCallbacks: ZoteroCallbacks

  tags = ['zotero', 'zotero-qa']

  constructor(fields: QAChainInput) {
    super(fields)
    // this.queryBuilderChain = fields.queryBuilderChain
    this.llm = fields.llm
    this.memory = fields.memory
    this.langChainCallbackManager = fields.langChainCallbackManager
    this.zoteroCallbacks = fields.zoteroCallbacks
    this.outputKey = fields.outputKey ?? this.outputKey
    this.prompt = fields.prompt ?? this.prompt
  }

  /** @ignore */
  async _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
    const outputParser = new OutputActionParser()
    // console.log(JSON.stringify(this.memory?.chatHistory.messages, null, 2))
    const llmChain = new ConversationChain({
      llm: this.llm,
      prompt: this.prompt,
      memory: new ReadOnlyBufferWindowMemory(this.memory),
      llmKwargs: {
        functions,
        function_call: { name: 'qa' },
        // TODO: Put chain metadata here until it is officially supported
        key: 'qa-chain',
        title: '📖 Generating the reply',
      } as any,
      outputParser,
      callbackManager: this.langChainCallbackManager,
      outputKey: this.outputKey,
    })
    const intermediateStep: string[] = []
    const output = await llmChain.call(values)
    const { action, payload } = JSON.parse(output[this.outputKey]) as
      | QAActionResponse
      | ClarificationActionResponse
      | ErrorActionResponse
    if (action === 'clarification' || action === 'error') {
      return output
    }

    const { answer, sources = [] } = payload as QAActionResponse['payload']
    const itemIds = sources.reduce((all: number[], source) => {
      try {
        const itemId = parseInt(source)
        if (Number.isInteger(itemId)) {
          return [...all, itemId]
        }
        return all
      } catch (e) {
        return all
      }
    }, [])
    const citations = itemIds.length ? await zot.createCitations(itemIds) : []
    return {
      [this.outputKey]: JSON.stringify({
        action,
        payload: { widget: 'QA_RESPONSE', input: { answer, sources: citations } },
      }),
    }
  }

  _chainType() {
    return 'qa_chain' as const
  }

  get inputKeys(): string[] {
    return ['input', 'context']
  }

  get outputKeys(): string[] {
    return [this.outputKey]
  }
}

interface loadQAChainInput {
  prompt?: ChatPromptTemplate
  langChainCallbackManager: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
  memory: BaseChatMemory
}

export const loadQAChain = (params: loadQAChainInput) => {
  const OPENAI_API_KEY = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string) || 'YOUR_OPENAI_API_KEY'
  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
    modelName: OPENAI_GPT_MODEL,
  })
  const { prompt = QA_DEFAULT_PROMPT, langChainCallbackManager, zoteroCallbacks, memory } = params
  const chain = new QAChain({ prompt, memory, llm, langChainCallbackManager, zoteroCallbacks })
  return chain
}

interface RetrievalQAChainInput {
  searchChain: SearchChain
  qaChain: QAChain
}

class RetrievalQAChain extends BaseChain {
  searchChain: SearchChain
  qaChain: QAChain
  inputKey = 'input'
  outputKey = 'output'
  tags = ['zotero', 'zotero-retrieval-qa']

  constructor(fields: RetrievalQAChainInput) {
    super()
    this.searchChain = fields.searchChain
    this.qaChain = fields.qaChain
  }

  /** @ignore */
  async _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
    const { items } = values?.states || {}
    let retrievalOutput
    if (items?.length) {
      // Use the pre-selected items if provided
      const results = await Promise.all(
        items.map(
          async (id: number) =>
            await retry(async () => zot.getItemAndBestAttachment(id, 'qa'), { retries: 3 } as Options)
        )
      )
      retrievalOutput = JSON.stringify({
        action: 'retrieval',
        payload: { widget: 'RETRIEVAL_RESULTS', input: { ids: items, results } },
      })
    } else {
      // Otherwise run a search to get relevant items
      retrievalOutput = (await this.searchChain.call(values))[this.outputKey]
    }
    const { action, payload } = JSON.parse(retrievalOutput)
    console.log({ action, payload })
    if (action === 'clarification') {
      return { [this.outputKey]: retrievalOutput }
    }
    const context = JSON.stringify(payload[this.inputKey].results)

    return this.qaChain.call({ [this.inputKey]: values[this.inputKey], context })
  }

  _chainType() {
    return 'retrieval_qa_chain' as const
  }

  get inputKeys(): string[] {
    return [this.inputKey]
  }

  get outputKeys(): string[] {
    return [this.outputKey]
  }
}

export const loadRetrievalQAChain = (params: loadQAChainInput) => {
  const OPENAI_API_KEY = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string) || 'YOUR_OPENAI_API_KEY'
  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
    modelName: OPENAI_GPT_MODEL,
  })
  const { prompt = QA_DEFAULT_PROMPT, langChainCallbackManager, zoteroCallbacks, memory } = params
  const searchChain = loadSearchChain({ langChainCallbackManager, zoteroCallbacks, memory, mode: 'qa' })
  const qaChain = new QAChain({ prompt, memory, llm, langChainCallbackManager, zoteroCallbacks })
  const chain = new RetrievalQAChain({
    searchChain,
    qaChain,
  })
  return chain
}

// export const loadQAChainAsTool = (llm: BaseLanguageModel, params: QAChainParams = {}) => {
//   return new ChainTool({
//     name: 'zotero-qa',
//     description:
//       'Useful for answering a question based on the content of references found in the Zotero database via the "zotero-search" tool.',
//     chain: loadQAChain(llm, params),
//   })
// }
