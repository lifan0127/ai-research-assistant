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
const QA_DEFAULT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    'You are a scholarly researcher that answers in an unbiased, scholarly tone. You sometimes refuse to answer if there is insufficient information.'
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `
Write an answer for the question below solely based on the provided context. 
If the context provides insufficient information, reply "I cannot answer".

Answer in an unbiased and scholarly tone. Make clear what is your opinion. 
Use Markdown for formatting code or text, and try to use direct quotes to support arguments.

Question: {question}
Answer:
  `.trim()
  ),
])

interface QAChainParams {
  prompt?: PromptTemplate
}

export const loadQAChain = (llm: BaseLanguageModel, params: QAChainParams = {}) => {
  const { prompt = QA_DEFAULT_PROMPT } = params
  const chain = new LLMChain({ prompt, llm })
  return chain
}

export const loadQAChainAsTool = (llm: BaseLanguageModel, params: QAChainParams = {}) => {
  return new ChainTool({
    name: 'zotero-qa',
    description:
      'Useful for answering a question based on references found in the Zotero database via the "zotero-search" tool.',
    chain: loadQAChain(llm, params),
  })
}
