// import { AgentExecutor } from 'langchain/agents'
// import { ChatOpenAI } from 'langchain/chat_models/openai'
// import { CallbackManager } from 'langchain/callbacks'
// import { config } from '../../../package.json'
// import { OPENAI_GPT_MODEL } from '../../constants'

// interface createQAExecutorInput {
//   langChainCallbackManager: CallbackManager
//   zoteroCallbacks: ZoteroCallbacks
// }

// export function createQAExecutor({ langChainCallbackManager, zoteroCallbacks }: createQAExecutorInput): AgentExecutor {
//   const OPENAI_API_KEY = Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string
//   const title = 'QA Assistant'
//   const description = `
//   QA Assistant analyzes and understands the content of your Zotero library. It can help streamline your research process by performing automatic literature search, summarization, and question & answer.
//   `
//   const chatModel = new ChatOpenAI({
//     temperature: 0,
//     openAIApiKey: OPENAI_API_KEY,
//     modelName: OPENAI_GPT_MODEL,
//   })

//   // const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
//   const zoteroSearchTool = loadZoteroSearchChainAsTool(chatModel)
//   const zoteroQATool = loadQAChainAsTool(chatModel)
//   const zoteroItemTool = new ZoteroItem()
//   const zoteroCollectionTool = new ZoteroCollection()
//   const zoteroSummaryTool = loadAnalyzeDocumentChainAsTool(chatModel)
//   const zoteroCreatorsTool = new ZoteroCreators()
//   const tools = [
//     zoteroSearchTool,
//     zoteroQATool,
//     zoteroItemTool,
//     // zoteroCollectionTool,
//     // zoteroSummaryTool,
//     // zoteroCreatorsTool,
//   ]
//   // const executor = await initializeAgentExecutor(tools, chatModel, 'chat-conversational-react-description', true)

//   const executor = AgentExecutor.fromAgentAndTools({
//     agent: ChatConversationalAgent.fromLLMAndTools(chatModel, tools, createPromptArgs),
//     tools,
//     verbose: true,
//     callbackManager: langChainCallbackManager,
//     maxIterations: 6,
//   })
//   executor.agent.llmChain.prompt.partialVariables = {
//     current_items: () => {
//       const items = ZoteroPane.getSelectedItems()
//       if (items.length > 0) {
//         return items.map(x => `${x.name} (ID: "${x.id}")`).join(', ')
//       }
//       return 'No selected items'
//     },
//     current_collection: () => {
//       const collection = ZoteroPane.getSelectedCollection()
//       if (collection) {
//         return `${collection.name} (ID: "${collection.id}")`
//       }
//       return 'None'
//     },
//   }
//   executor.memory = new BufferWindowMemory({
//     returnMessages: true,
//     memoryKey: 'chat_history',
//     inputKey: 'input',
//     k: 5
//   })
//   return executor
// }
