import { BaseChain } from 'langchain/chains'
import { BaseChatMemory, BufferWindowMemory } from 'langchain/memory'
import { CallbackManager } from 'langchain/callbacks'
import { serializeError } from 'serialize-error'
import YAML from 'yaml'
import { Routes, createRouter, createRouteFunctions } from './chains/router'
import { loadSearchChain } from './chains/search'
import { loadRetrievalQAChain } from './chains/qa'
import { ZoteroCallbacks, ErrorCallbacks } from './utils/callbacks'
import { Message } from '../views/components/message/types'
import { simplifyStates, serializeStates, States } from './utils/states'
import { loadVisionChain } from './chains/vision'

interface ResearchAssistantFields {
  langChainCallbackManager: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
  errorCallbacks: ErrorCallbacks
}

export class ResearchAssistant {
  routes: Routes
  router: BaseChain
  zoteroCallbacks: ZoteroCallbacks
  errorCallbacks: ErrorCallbacks
  memory: BaseChatMemory

  constructor({ langChainCallbackManager, zoteroCallbacks, errorCallbacks }: ResearchAssistantFields) {
    this.memory = new BufferWindowMemory({ returnMessages: true, memoryKey: 'history', k: 5, inputKey: 'input' })
    this.routes = {
      // manage: {
      //   description: 'For reference management in Zotero.',
      //   executor: null
      // },
      search: {
        description:
          "For searching user's Zotero library related to a specific topic. Use this route when a user expects to see a list of search results.",
        executor: loadSearchChain({ langChainCallbackManager, zoteroCallbacks, memory: this.memory, mode: 'search' }),
      },
      qa: {
        description:
          "For Q&A and other related requests based on user's Zotero library. Use this route when a user expects to get an answer or a summary of search results.",
        executor: loadRetrievalQAChain({ langChainCallbackManager, zoteroCallbacks, memory: this.memory }),
      },
      vision: {
        description:
          'For visual analysis of provided images, typically based on Zotero annotations. If the user input includes any images, you must choose this route or clarification.',
        executor: loadVisionChain({ langChainCallbackManager, zoteroCallbacks, memory: this.memory }),
      },
      // help: {
      //   description: 'For help with how to use AI assistant for Zotero.',
      //   executor: null
      // },
    }
    const functions = createRouteFunctions(this.routes)
    this.router = createRouter({ memory: this.memory, functions, callbackManager: langChainCallbackManager })
    this.zoteroCallbacks = zoteroCallbacks
    this.errorCallbacks = errorCallbacks
  }

  async call(content: string, states: States) {
    try {
      // throw new Error('Test Error')
      const { output } = await this.router.call({ input: content, states: simplifyStates(states) })
      const { action, payload } = JSON.parse(output)
      console.log({ action, payload: JSON.stringify(payload) })
      if (action === 'clarification') {
        payload._raw = output
        return { action, payload }
      }
      const { route, input: updatedInput, states: relevantStates } = payload
      // console.log(JSON.stringify((this.memory?.chatHistory as any).messages, null, 2))
      const selectedRoute = this.routes[route]
      const executor = selectedRoute?.executor || this.routes.qa.executor
      // return { action: 'routing', payload: { widget: 'MARKDOWN', input: { content: 'test' } } }

      const { output: executorOutput } = await executor.call({
        input: updatedInput,
        relevantStates,
        states,
      })
      switch (route) {
        case 'search':
        case 'qa':
        case 'vision': {
          const { action, payload } = JSON.parse(executorOutput)
          // console.log({ route, action, payload: JSON.stringify(payload) })
          payload._raw = executorOutput
          return { action, payload }
        }
      }
    } catch (error: any) {
      this.errorCallbacks.handleErrorEnd(error)
      const errorObj = serializeError(error)
      return {
        action: 'error',
        payload: {
          error: errorObj,
          _raw: JSON.stringify(errorObj, null, 2),
        },
      }
    }
  }

  resetMemory() {
    this.memory.chatHistory.clear()
  }

  rebuildMemory(messages: Message[]) {
    this.memory.chatHistory.clear()
    messages.forEach(message => {
      switch (message.type) {
        case 'USER_MESSAGE': {
          return this.memory.chatHistory.addUserMessage(message.content.newValue)
        }
        case 'BOT_MESSAGE': {
          return this.memory.chatHistory.addAIChatMessage(message._raw)
        }
      }
    })
  }
}
