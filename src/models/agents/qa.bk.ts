// import { BaseAgent } from './base'
// import { PromptManager } from 'zotero-plugin-toolkit/dist/managers/prompt'
// import { config } from '../../../package.json'
// import { OpenAI } from 'langchain'
// import { ChatOpenAI } from 'langchain/chat_models/openai'
// import { AgentExecutor, ChatConversationalAgent, initializeAgentExecutor } from 'langchain/agents'
// import { loadZoteroSearchChainAsTool } from '../chains/search'
// import { ZoteroItem } from '../tools/zoteroItem'
// import { ZoteroCollection } from '../tools/zoteroCollection'
// import { ZoteroCreators } from '../tools/zoteroCreators'
// // import { ZoteroRetrieval } from './tools/zoteroRetrieval'
// import { BufferWindowMemory } from 'langchain/memory'
// import { PromptTemplate } from 'langchain/prompts'
// import { loadQAChainAsTool } from '../chains/qa'
// import { loadAnalyzeDocumentChainAsTool } from '../chains/summary'
// import { OpenAIEmbeddings } from 'langchain/embeddings'
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
// import { WasmVectorStore } from '../vectorstore'
// import { SQLiteCache } from '../cache'
// import { ExecutorParams } from './base'
// import { AgentArgs } from 'langchain/dist/agents/agent'
// import { AgentOutputParser } from './util'
// import { OPENAI_GPT_MODEL } from '../../constants'

// const PREFIX = `QA Assistant is a large language model trained by OpenAI.
// QA Assistant is designed to be able to answer questions based on articles stored in Zotero, a desktop reference management tool.
// QA Assistant can search Zotero to find the information to answer the user's question. If unable to find relevant information in Zotero, Assistant should politely decline the request and ask the user to try again with a different question.
// Whenever a Zotero item is mentioned in answer, please, please include the item's Zotero ID in the answer, like [ID:1234].
// Where appropriate, use bullet points or table as part of your response.
// QA Assistant can use Zotero state information, such as the current items, current collection and current library to scope the answer as directed by the user.
// `

// const SUFFIX = `TOOLS
// ------
// QA Assistant can ask the user to use tools to look up information that may be helpful in answering the users original question. The tools the human can use are:
// {{tools}}
// {format_instructions}
// Please, please ALWAYS adhere to the response format instructions above. If you do not, I will not be able to understand your response and will not be able to learn from it.
// APPLICATION STATES
// --------------------
// The following Zotero application states are relevant to user questions. Do NOT rely on chat history as application state changes constantly.
// - Current Items: {{{{current_items}}}}
// - Current Collection: {{{{current_collection}}}}
// USER'S INPUT
// --------------------
// Here is the user's input (remember to respond with a markdown code snippet of a json blob with a single action, and NOTHING else):
// {{{{input}}}}`

// const createPromptArgs = {
//   systemMessage: PREFIX,
//   humanMessage: SUFFIX,
//   outputParser: new AgentOutputParser(),
// }

// // class QAAgent extends BaseAgent {
// //   constructor() {
// //     super('qa', 'QA: Question and Answer', config.addonInstance)
// //   }
// // }

// // export const qa = new QAAgent()

// export function createQAExecutor({ langChainCallbackManager, zoteroCallbacks }: ExecutorParams): AgentExecutor {
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
