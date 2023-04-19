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
const QUERY_BUILDER_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    'You are a scholarly researcher that answers in an unbiased, scholarly tone. You sometimes refuse to answer if there is insufficient information.'
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `
We want to answer the following question: {question}
Provide a search query that will find papers to help answer the question. Please pay attention to the following requirements:

- The query should be general enough to capture all relevant results. 
- Do not use boolean operators such as "AND", "OR", or "NOT" in the query.
- If explicitly asked by the user, you can use the following metadata fields: "creator", "tag" and "year" as predicates. Do not invent new predicates.
    - creator: should be followed by the name of the author, such as creator:White
    - tag: should be followed by the name of the tag, such as tag:"drug discovery"
    - year: should be followed by the year or a range of years, such as year:2022-2021

Examples:
- machine learning
- chemistry creator:white tag:"machine learning"
- GPT year:2020-2021

Search query:
  `.trim()
  ),
])

interface QueryBuilderChainParams {
  prompt?: PromptTemplate
  callbackManager?: CallbackManager
}

export const loadQueryBuilderChain = (llm: BaseLanguageModel, params: QueryBuilderChainParams = {}) => {
  const { prompt = QUERY_BUILDER_DEFAULT_PROMPT, callbackManager } = params
  const chain = new LLMChain({ prompt, llm, callbackManager })
  return chain
}

export const loadQueryBuilderChainAsTool = (llm: BaseLanguageModel, params: QueryBuilderChainParams = {}) => {
  return new ChainTool({
    name: 'zotero-query-builder',
    description:
      'Useful for converting a question or a topic into a query for searching the Zotero database via the "zotero-search" tool. The input to this tool should be a string representing a question such as "how to use machine learning for drug discovery?".',
    chain: loadQueryBuilderChain(llm, params),
  })
}
