import { BaseLanguageModel } from 'langchain/base_language'
import { loadSummarizationChain, AnalyzeDocumentChain } from 'langchain/chains'
import { ChainTool } from 'langchain/tools'

export const loadAnalyzeDocumentChainAsTool = (llm: BaseLanguageModel) => {
  const combineDocsChain = loadSummarizationChain(llm, { type: 'stuff' })
  const chain = new AnalyzeDocumentChain({
    combineDocumentsChain: combineDocsChain,
  })

  return new ChainTool({
    name: 'zotero-summary',
    description:
      'Useful for generating a short summary from a long article the Zotero database. The input should be a LONG string representing the entire content of a single article. The input should not be an item ID such as "568" or multiple articles.',
    chain: chain,
  })
}

// import { BaseLanguageModel } from 'langchain/base_language'
// import { PromptTemplate } from 'langchain/prompts'
// import { LLMChain } from 'langchain/chains'

// // Prompt credit: https://github.com/whitead/paper-qa/blob/main/paperqa/qaprompts.py
// const SUMMARY_DEFAULT_PROMPT = new PromptTemplate({
//   inputVariables: ['question', 'context_str', 'citation'],
//   template: `
// Summarize and provide direct quotes from the text below to help answer a question.
// Do not directly answer the question, instead summarize and quote to give evidence to help answer the question.
// Do not use outside sources.
// Reply with "Not applicable" if the text is unrelated to the question.
// Use 75 or less words.

// {context_str}

// Extracted from {citation}

// Question: {question}

// Relevant Information Summary:
//   `.trim(),
// })

// interface SummaryChainParams {
//   prompt?: PromptTemplate
// }

// export const loadSummaryChain = (llm: BaseLanguageModel, params: SummaryChainParams = {}) => {
//   const { prompt = SUMMARY_DEFAULT_PROMPT } = params
//   const chain = new LLMChain({ prompt, llm })
//   return chain
// }
