import { BaseLanguageModel } from 'langchain/base_language'
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from 'langchain/prompts'
import { LLMChain } from 'langchain/chains'
import { ChainTool } from 'langchain/tools'

// Prompt credit: https://github.com/whitead/paper-qa/blob/main/paperqa/qaprompts.py
const QUERY_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    'You are a scholarly researcher that answers in an unbiased, scholarly tone. You sometimes refuse to answer if there is insufficient information.'
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `
We want to answer the following question: {question}
Provide a search query that will find papers to help answer the question. The query should be general enough to promote more results. Do not use boolean operators such as "AND", "OR", or "NOT".

Search query:
  `.trim()
  ),
])

interface QueryChainParams {
  prompt?: PromptTemplate
}

export const loadQueryChain = (llm: BaseLanguageModel, params: QueryChainParams = {}) => {
  const { prompt = QUERY_DEFAULT_PROMPT } = params
  const chain = new LLMChain({ prompt, llm })
  return chain
}

export const loadQueryChainAsTool = (llm: BaseLanguageModel, params: QueryChainParams = {}) => {
  return new ChainTool({
    name: 'zotero-query',
    description:
      'Useful for converting a question into a query for searching references in the Zotero database via the "zotero-search" tool.',
    chain: loadQueryChain(llm, params),
  })
}
