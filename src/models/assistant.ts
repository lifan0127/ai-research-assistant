import { BaseChain } from 'langchain/chains'
import { BaseChatMemory, BufferWindowMemory } from 'langchain/memory'
import { Routes, createRouter, createRouteFunctions } from './chains/router'
import { CallbackManager } from 'langchain/callbacks'
import { loadSearchChain } from './chains/search'
import { loadRetrievalQAChain } from './chains/qa'
import { ZoteroCallbacks, ErrorCallbacks } from './utils/callbacks'

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
        description: "For search user's Zotero library related to a specific topic.",
        executor: loadSearchChain({ langChainCallbackManager, zoteroCallbacks, memory: this.memory, mode: 'search' }),
      },
      qa: {
        description: "For question and answer based on user's Zotero library.",
        executor: loadRetrievalQAChain({ langChainCallbackManager, zoteroCallbacks, memory: this.memory }),
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

  async call(input: string) {
    try {
      const { output } = await this.router.call({ input })
      const { action, payload } = JSON.parse(output)
      // console.log({ action, payload: JSON.stringify(payload) })
      if (action === 'clarification') {
        return { action, payload }
      }
      const { route, input: updatedInput } = payload
      // console.log(JSON.stringify((this.memory?.chatHistory as any).messages, null, 2))
      const { executor } = this.routes[route]
      // return { action: 'routing', payload: { widget: 'MARKDOWN', input: { content: 'test' } } }
      const { output: executorOutput } = await executor.call({ input: updatedInput })

      switch (route) {
        case 'search': {
          const { action, payload } = JSON.parse(executorOutput)
          // console.log({ route, action, payload: JSON.stringify(payload) })
          return { action, payload }
        }
        case 'qa': {
          const { action, payload } = JSON.parse(executorOutput)
          console.log({ route, action, payload: JSON.stringify(payload) })
          return { action, payload }
        }
      }
    } catch (error: any) {
      this.errorCallbacks.handleErrorEnd(error)
      return {
        action: 'error',
        payload: {
          error,
        },
      }
    }
  }

  resetMemory() {
    this.memory.chatHistory.clear()
  }
}
