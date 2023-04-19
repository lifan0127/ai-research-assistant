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
import { ZoteroCreators } from '../tools/zoteroCreators'
// import { ZoteroRetrieval } from './tools/zoteroRetrieval'
import { BufferMemory } from 'langchain/memory'
import { PromptTemplate } from 'langchain/prompts'
import { loadQueryBuilderChainAsTool } from '../chains/queryBuilder'
import { loadQAChainAsTool } from '../chains/qa'
import { loadAnalyzeDocumentChainAsTool } from '../chains/summary'
import { OpenAIEmbeddings } from 'langchain/embeddings'
import { Document } from 'langchain/docstore'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { WasmVectorStore } from '../vectorstore'
import { SQLiteCache } from '../cache'
import { CreatePromptArgs } from 'langchain/dist/agents/chat_convo'
import { callbackManagerArgs } from './base'
import { AgentArgs } from 'langchain/dist/agents/agent'

const PREFIX = `Assistant is a large language model trained by OpenAI.
Assistant is designed to be able to assist with a wide range of tasks related to the users of Zotero, a desktop reference management tool, such as finding articles from the Zotero database, summarizing results and answering questions. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topics related to Zotero.
Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of Zotera-related topics.
Assistant is able to access user's Zotero database and can search for items in the database.
Whenever possible, Assistant should search Zotero to find the information to answer the user's question. If unable to find relevant information in Zotero, Assistant should politely decline the request and ask the user to try again with a different question. 
Whenever a Zotero item is mentioned in answer, please, please include the item's Zotero ID in the answer, like [ID:1234].
Where appropriate, incorporate bullet points or table as part of your response.
Assistant should politely decline any requests that are unrelated to Zotero reference management, such as: 
- How to cook certain food such as french toast, pizza etc.. 
- Request to prodcue a story, ajoke, a poem, a song or like.`

const FORMAT_INSTRUCTIONS = `RESPONSE FORMAT INSTRUCTIONS
----------------------------
When responding to me please, please output a response in one of two formats:
**Option 1:**
Use this if you want the human to use a tool.
Markdown code snippet formatted in the following schema:
\`\`\`json
{{{{
    "action": string \\ The action to take. Must be one of {tool_names}
    "action_input": string \\ The input to the action
}}}}
\`\`\`
**Option #2:**
Use this if you want to respond directly to the human. Markdown code snippet formatted in the following schema:
\`\`\`json
{{{{
    "action": "Final Answer",
    "action_input": string \\ You should put what you want to return to use here
}}}}
\`\`\``

const SUFFIX = `TOOLS
------
Assistant can ask the user to use tools to look up information that may be helpful in answering the users original question. The tools the human can use are:
{{tools}}
{format_instructions}
Please, please ALWAYS adhere to the response format instructions above. If you do not, I will not be able to understand your response and will not be able to learn from it.
USER'S INPUT
--------------------
Here is the user's input (remember to respond with a markdown code snippet of a json blob with a single action, and NOTHING else):
{{{{input}}}}`

const TEMPLATE_TOOL_RESPONSE = `TOOL RESPONSE: 
---------------------
{observation}
USER'S INPUT
--------------------
Okay, so what is the response to my original question? If using information from tools, you must say it explicitly - I have forgotten all TOOL RESPONSES! Remember to respond with a markdown code snippet of a json blob with a single action, and NOTHING else.`

export class QAAgentOutputParser extends AgentActionOutputParser {
  async parse(text: string) {
    let jsonOutput = text.trim()
    console.log('jsonOutput', jsonOutput)
    if (jsonOutput.includes('```json')) {
      jsonOutput = jsonOutput.split('```json')[1].trimStart()
    }
    if (jsonOutput.includes('```')) {
      jsonOutput = jsonOutput.split('```')[0].trimEnd()
    }
    if (jsonOutput.startsWith('```')) {
      jsonOutput = jsonOutput.slice(3).trimStart()
    }
    if (jsonOutput.endsWith('```')) {
      jsonOutput = jsonOutput.slice(0, -3).trimEnd()
    }

    try {
      const response = JSON.parse(jsonOutput)

      let { action, action_input } = response

      if (typeof action_input === 'object') {
        action_input = JSON.stringify(action_input)
      }

      if (action === 'Final Answer') {
        return { returnValues: { output: action_input }, log: text }
      }
      return { tool: action, toolInput: action_input, log: text }
    } catch (error) {
      return { returnValues: { output: text }, log: text }
    }
  }

  getFormatInstructions(): string {
    return FORMAT_INSTRUCTIONS
  }
}

const createPromptArgs: CreatePromptArgs & AgentArgs = {
  systemMessage: PREFIX,
  humanMessage: SUFFIX,
  outputParser: new QAAgentOutputParser(),
}

class QAAgent extends BaseAgent {
  constructor() {
    super('qa', 'QA: Question and Answer', config.addonInstance)
  }
}

export const qa = new QAAgent()

export async function createQAExecutor({ callbackManager }: callbackManagerArgs): Promise<ExecutorWithMetadata> {
  const OPENAI_API_KEY = Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string
  const title = 'QA Assistant'
  const description = `
  QA Assistant analyzes and understands the content of your Zotero library. It can help streamline your research process by performing automatic literature search, summarization, and question & answer.
  `
  const chatModel = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
    modelName: 'gpt-3.5-turbo',
  })

  // const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
  const zoteroQueryBuilderTool = loadQueryBuilderChainAsTool(chatModel)
  const zoteroQATool = loadQAChainAsTool(chatModel)
  const zoteroItemTool = new ZoteroItem()
  const zoteroSummaryTool = loadAnalyzeDocumentChainAsTool(chatModel)
  const zoteroSearchTool = new ZoteroSearch()
  const zoteroCreatorsTool = new ZoteroCreators()
  const tools = [
    zoteroQueryBuilderTool,
    zoteroSearchTool,
    zoteroQATool,
    zoteroItemTool,
    zoteroSummaryTool,
    zoteroCreatorsTool,
  ]
  // const executor = await initializeAgentExecutor(tools, chatModel, 'chat-conversational-react-description', true)

  const executor = AgentExecutor.fromAgentAndTools({
    agent: ChatConversationalAgent.fromLLMAndTools(chatModel, tools, createPromptArgs),
    tools,
    verbose: true,
    callbackManager,
    maxIterations: 6,
  })
  executor.memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
  })
  return { executor, metadata: { title, description } }
}
