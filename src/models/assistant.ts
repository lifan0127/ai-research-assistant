import { BaseChain } from 'langchain/chains'
import { BaseChatMemory, BufferWindowMemory } from 'langchain/memory'
import { Routes, createRouter, createRouteFunctions } from './chains/router'
import { CallbackManager } from 'langchain/callbacks'
import { serializeError } from 'serialize-error'
import { loadSearchChain } from './chains/search'
import { loadRetrievalQAChain } from './chains/qa'
import { ZoteroCallbacks } from './utils/callbacks'

interface ResearchAssistantFields {
  langChainCallbackManager: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
}

export class ResearchAssistant {
  routes: Routes
  router: BaseChain
  zoteroCallbacks: ZoteroCallbacks
  memory: BaseChatMemory

  constructor({ langChainCallbackManager, zoteroCallbacks }: ResearchAssistantFields) {
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
          console.log({ qa: executorOutput })
          const { action, payload } = JSON.parse(executorOutput)
          console.log({ route, action, payload: JSON.stringify(payload) })
          return { action, payload }
        }
      }
    } catch (error) {
      const errorObj = serializeError(error)
      if (errorObj.message?.includes('Incorrect API key provided')) {
        return {
          action: 'error',
          payload: {
            message: `
#### OpenAI API key is required to use Aria.

* Select _Edit_ from the top menu bar, and then select _Preferences_ from the dropdown menu.
* On the top panel or the left-hand side panel, select _Aria_.
* Locate the _OpenAI API key_ field and enter your API key in the text box.
* Click the _Close_ button to save your chagne and __restart Zotero__.
            `.trim(),
          },
        }
      }
      const errorResponse = {
        action: 'error',
        payload: { message: `Something went wrong: ${JSON.stringify(errorObj)}` },
      }
      console.log({ errorResponse })
      return errorResponse
    }
  }

  resetMemory() {
    this.memory.chatHistory.clear()
  }
}
