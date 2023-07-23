import { BaseAgent, ExecutorWithMetadata } from './base'
import { PromptManager } from 'zotero-plugin-toolkit/dist/managers/prompt'
import { config } from '../../../package.json'
import { OpenAI } from 'langchain'
import { ChatOpenAI } from 'langchain/chat_models'
import {
  AgentActionOutputParser,
  AgentExecutor,
  ChatConversationalAgent,
  initializeAgentExecutor,
} from 'langchain/agents'
import { ZoteroSearch } from '../tools/zoteroSearch'
import { ZoteroItem } from '../tools/zoteroItem'
import { ZoteroCollection } from '../tools/zoteroCollection'
import { ZoteroCreators } from '../tools/zoteroCreators'
// import { ZoteroRetrieval } from './tools/zoteroRetrieval'
import { BufferWindowMemory } from 'langchain/memory'
import { PromptTemplate } from 'langchain/prompts'
// import { loadQueryBuilderChainAsTool } from '../chains/search'
import { loadQAChainAsTool } from '../chains/qa'
import { loadAnalyzeDocumentChainAsTool } from '../chains/summary'
import { OpenAIEmbeddings } from 'langchain/embeddings'
import { Document } from 'langchain/docstore'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { WasmVectorStore } from '../vectorstore'
import { SQLiteCache } from '../cache'
import { ExecutorParams } from './base'
import { AgentArgs } from 'langchain/dist/agents/agent'
import { AgentOutputParser } from './util'
import { OPENAI_GPT_MODEL } from '../../constants'

const PREFIX = `Help Desk is a large language model trained by OpenAI.
Help Desk is designed to help new users on how to use Zotero, a desktop reference management tool. As a language model, 
Help Desk is able to access Zotero documentation.
Where appropriate, incorporate bullet points or table as part of your response.
Help Desk can use Zotero system information, such as the installed plugins.
`

const SUFFIX = `TOOLS
------
Help Desk can ask the user to use tools to look up information that may be helpful in answering the users original question. The tools the human can use are:
{{tools}}
{format_instructions}
Please, please ALWAYS adhere to the response format instructions above. If you do not, I will not be able to understand your response and will not be able to learn from it.
APPLICATION STATES
--------------------
The following Zotero application states are relevant to user questions. Do NOT rely on chat history as application state changes constantly.
- Current Items: {{{{current_items}}}}
- Current Collection: {{{{current_collection}}}}
USER'S INPUT
--------------------
Here is the user's input (remember to respond with a markdown code snippet of a json blob with a single action, and NOTHING else):
{{{{input}}}}`

const createPromptArgs = {
  systemMessage: PREFIX,
  humanMessage: SUFFIX,
  outputParser: new AgentOutputParser(),
}

export function createHelpExecutor({ callbackManager }: ExecutorParams): ExecutorWithMetadata {
  const OPENAI_API_KEY = Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string
  const title = 'Help Desk'
  const description = `
  Help Desk help you become a proficient Zotero user.
  `
  const chatModel = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
    modelName: OPENAI_GPT_MODEL,
  })

  // const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
  // const zoteroQueryBuilderTool = loadQueryBuilderChainAsTool(chatModel)
  // const zoteroQATool = loadQAChainAsTool(chatModel)
  // const zoteroItemTool = new ZoteroItem()
  // const zoteroCollectionTool = new ZoteroCollection()
  // const zoteroSummaryTool = loadAnalyzeDocumentChainAsTool(chatModel)
  // const zoteroSearchTool = new ZoteroSearch()
  // const zoteroCreatorsTool = new ZoteroCreators()
  const tools = [
    // zoteroQueryBuilderTool,
    // zoteroSearchTool,
    // zoteroQATool,
    // zoteroItemTool,
    // zoteroCollectionTool,
    // zoteroSummaryTool,
    // zoteroCreatorsTool,
  ]
  // const executor = await initializeAgentExecutor(tools, chatModel, 'chat-conversational-react-description', true)

  const executor = AgentExecutor.fromAgentAndTools({
    agent: ChatConversationalAgent.fromLLMAndTools(chatModel, tools, createPromptArgs),
    tools,
    verbose: true,
    callbackManager,
    maxIterations: 6,
  })
  executor.agent.llmChain.prompt.partialVariables = {
    current_items: () => {
      const items = ZoteroPane.getSelectedItems()
      if (items.length > 0) {
        return items.map(x => `${x.name} (ID: "${x.id}")`).join(', ')
      }
      return 'No selected items'
    },
    current_collection: () => {
      const collection = ZoteroPane.getSelectedCollection()
      if (collection) {
        return `${collection.name} (ID: "${collection.id}")`
      }
      return 'None'
    },
  }
  executor.memory = new BufferWindowMemory({
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
    k: 5,
  })
  return { executor, metadata: { title, description } }
}
