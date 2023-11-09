import { BaseLanguageModel } from 'langchain/base_language'
import { CallbackManager, CallbackManagerForChainRun } from 'langchain/callbacks'
import { BaseChain, ChainInputs, ConversationChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models/openai'
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

const VISION_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `
Write an answer for the question below based on the provided images and relevant application states as sources.

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
              ? `Application States:\n${serializeStates(values.relevantStates)}\n\n` + values.input
              : values.input,
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
  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
    modelName: 'gpt-4-vision-preview',
    maxTokens: 4096,
  })
  const { prompt = VISION_DEFAULT_PROMPT, langChainCallbackManager, zoteroCallbacks, memory } = params
  const chain = new VisionChain({ prompt, memory, llm, langChainCallbackManager, zoteroCallbacks })
  return chain
}
