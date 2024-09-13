import { BaseLanguageModel } from 'langchain/base_language'
import { CallbackManager, CallbackManagerForChainRun } from 'langchain/callbacks'
import { BaseChain, ChainInputs, ConversationChain } from 'langchain/chains'
import { ChatOpenAI } from '@langchain/openai'
import { BaseChatMemory } from 'langchain/memory'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from 'langchain/prompts'
import { ChainValues, HumanMessage } from 'langchain/schema'
import retry, { Options } from 'async-retry'
import { config } from '../../../package.json'
import { ClarificationActionResponse, ErrorActionResponse, VisionActionResponse } from '../utils/actions'
import { ZoteroCallbacks } from '../utils/callbacks'
import { ReadOnlyBufferWindowMemory } from '../utils/memory'
import { SimplifiedStates, serializeStates, States } from '../utils/states'
import { OutputActionParser } from '../utils/parsers'
import * as zot from '../../apis/zotero'

const VISION_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `
Write an answer for the question below based on the provided images, the relevant application states and optional context as sources.

Use all the information within the images, including captions, tables, diagrams, plots, images etc.

If the question is not clear, ask for clarification.
    `
  ),
  new MessagesPlaceholder('history'),
  new MessagesPlaceholder('input'),
])

export interface VisionChainInput extends ChainInputs {
  llm: BaseLanguageModel
  prompt?: ChatPromptTemplate
  inputKey?: string
  outputKey?: string
  langChainCallbackManager?: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
  memory: BaseChatMemory
}

export class VisionChain extends BaseChain {
  // LLM wrapper to use
  llm: BaseLanguageModel
  memory: BaseChatMemory
  prompt = VISION_DEFAULT_PROMPT
  inputKey = 'input'
  outputKey = 'output'
  langChainCallbackManager: CallbackManager | undefined
  zoteroCallbacks: ZoteroCallbacks
  tags = ['zotero', 'zotero-annotation']

  constructor(fields: VisionChainInput) {
    super(fields)
    this.llm = fields.llm
    this.memory = fields.memory
    this.langChainCallbackManager = fields.langChainCallbackManager
    this.zoteroCallbacks = fields.zoteroCallbacks
    this.inputKey = fields.inputKey ?? this.inputKey
    this.outputKey = fields.outputKey ?? this.outputKey
    this.prompt = fields.prompt ?? this.prompt
  }

  /** @ignore */
  async _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
    // const outputParser = new OutputActionParser()
    // console.log(JSON.stringify((this.memory?.chatHistory as any).messages, null, 2))
    const llmChain = new ConversationChain({
      llm: this.llm,
      prompt: this.prompt,
      memory: new ReadOnlyBufferWindowMemory(this.memory),
      llmKwargs: {
        // TODO: Put chain metadata here until it is officially supported
        key: 'vision-chain',
        title: '🛠️ Performing visual analysis',
      } as any,
      // outputParser,
      callbackManager: this.langChainCallbackManager,
      outputKey: this.outputKey,
    })

    let inputText = 'Question: ' + values.input

    if (values.relevantStates.items && values.relevantStates.items.length > 0) {
      const results = await Promise.all(
        values.relevantStates.items.map(
          async (id: number) =>
            await retry(async () => zot.getItemAndBestAttachment(id, 'qa'), { retries: 3 } as Options)
        )
      )
      if (results.length > 0) {
        inputText = '\n\nContext:\n' + JSON.stringify(results) + '\n\n' + inputText
      }
    }

    const imageMessages = (values.states as States).images.map(({ image }) => ({
      type: 'image_url' as const,
      image_url: {
        url: image,
      },
    }))

    const input = [
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: values.relevantStates
              ? `Application States:\n${serializeStates(values.relevantStates)}\n\n` + inputText
              : inputText,
          },
          ...imageMessages,
        ],
      }),
    ]
    const output = await llmChain.call({ history: values.history, input })
    // const output = await llmChain.call({ ...values, states: serializeStates(values.states) })
    const action = 'vision'

    const payload = { widget: 'MARKDOWN', input: { content: output.output } }
    return {
      [this.outputKey]: JSON.stringify({ action, payload }),
    }
  }

  _chainType() {
    return 'vision_chain' as const
  }

  get inputKeys(): string[] {
    return [this.inputKey]
  }

  get outputKeys(): string[] {
    return [this.outputKey]
  }
}

interface LoadVisionChainInput {
  prompt?: ChatPromptTemplate
  langChainCallbackManager: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
  memory: BaseChatMemory
}

export const loadVisionChain = (params: LoadVisionChainInput) => {
  const OPENAI_API_KEY = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string) || 'YOUR_OPENAI_API_KEY'
  const OPENAI_MODEL = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || 'gpt-4o'
  const OPENAI_BASE_URL =
    (Zotero.Prefs.get(`${config.addonRef}.OPENAI_BASE_URL`) as string) || 'https://api.openai.com/v1'
  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
    modelName: OPENAI_MODEL,
    maxTokens: 4096,
    configuration: {
      baseURL: OPENAI_BASE_URL,
    },
  })
  const { prompt = VISION_DEFAULT_PROMPT, langChainCallbackManager, zoteroCallbacks, memory } = params
  const chain = new VisionChain({ prompt, memory, llm, langChainCallbackManager, zoteroCallbacks })
  return chain
}
