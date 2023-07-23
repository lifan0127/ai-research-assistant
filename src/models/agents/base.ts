import { PromptManager } from 'zotero-plugin-toolkit/dist/managers/prompt'
import { Command } from 'zotero-plugin-toolkit/dist/managers/prompt'
import { AgentExecutor } from 'langchain/agents'
import { CallbackManager } from 'langchain/callbacks'
import { ZoteroCallbacks } from '../utils/callbacks'

export abstract class BaseAgent {
  id: string
  name: string
  label: string

  constructor(id: string, name: string, label: string) {
    this.id = id
    this.name = name
    this.label = label
  }

  toPromptDefinition(): Command {
    return {
      id: this.id,
      name: this.name,
      label: this.label,
      callback: prompt => {
        addon.hooks.onDialogEvents('dialogExample')
        // @ts-ignore
        prompt.exit()
      },
    }
  }
}

export type ExecutorWithMetadata = {
  executor: AgentExecutor
  metadata: {
    title: string
    description: string
  }
}

export type ExecutorParams = {
  langChainCallbackManager: CallbackManager
  zoteroCallbacks: ZoteroCallbacks
}
