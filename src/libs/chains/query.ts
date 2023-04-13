import { BaseLanguageModel } from 'langchain/base_language'
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from 'langchain/prompts'
import { LLMChain } from 'langchain/chains'
import { ChainTool } from 'langchain/tools'
import { CallbackManager } from 'langchain/callbacks'

// Prompt credit: https://github.com/whitead/paper-qa/blob/main/paperqa/qaprompts.py
const QUERY_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    'You are a scholarly researcher that answers in an unbiased, scholarly tone. You sometimes refuse to answer if there is insufficient information.'
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `
We want to answer the following question: {question}
Provide a search query that will find papers to help answer the question. The query should be general enough to capture all relevant results. Please, please do not use boolean operators such as "AND", "OR", or "NOT" in the query.

Search query:
  `.trim()
  ),
])

interface QueryChainParams {
  prompt?: PromptTemplate
  callbackManager?: CallbackManager
}

export const loadQueryChain = (llm: BaseLanguageModel, params: QueryChainParams = {}) => {
  const { prompt = QUERY_DEFAULT_PROMPT, callbackManager } = params
  const chain = new LLMChain({ prompt, llm, callbackManager })
  return chain
}

export const loadQueryChainAsTool = (llm: BaseLanguageModel, params: QueryChainParams = {}) => {
  return new ChainTool({
    name: 'zotero-query',
    description:
      'Useful for converting a question into a query ONLY for searching references in the Zotero database via the "zotero-search" tool.',
    chain: loadQueryChain(llm, params),
  })
}
