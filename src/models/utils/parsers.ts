import { JsonOutputFunctionsParser } from 'langchain/output_parsers'
import { ChatGeneration, Generation } from 'langchain/schema'
import { BaseLLMOutputParser } from 'langchain/schema/output_parser'
import { serializeError } from 'serialize-error'
import { LLMChain } from 'langchain/chains'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from 'langchain/prompts'
import { config } from '../../../package.json'

const OPENAI_API_KEY = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string) || 'YOUR_OPENAI_API_KEY'
const OPENAI_MODEL = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || 'gpt-4-1106-preview'
const OPENAI_BASE_URL =
  (Zotero.Prefs.get(`${config.addonRef}.OPENAI_BASE_URL`) as string) || 'https://api.openai.com/v1'
const llm = new ChatOpenAI({
  temperature: 0,
  openAIApiKey: OPENAI_API_KEY,
  modelName: OPENAI_MODEL,
  configuration: {
    baseURL: OPENAI_BASE_URL,
  },
})
const prompt = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `
Your job is to examine a JSON string, correct any format issues and ouput a new, valid JSON string.
    `.trim()
  ),
  HumanMessagePromptTemplate.fromTemplate(
    `
Broken JSON string: {input}
Valid JSON string: 
    `.trim()
  ),
])
const chain = new LLMChain({ llm, prompt })

export class OutputActionParser extends BaseLLMOutputParser<string> {
  lc_namespace = ['langchain', 'chains', 'openai_functions']

  outputParser = new JsonOutputFunctionsParser()

  async parseResult(generations: Generation[] | ChatGeneration[]): Promise<string> {
    try {
      // console.log({ generations: generations[0].message.additional_kwargs.function_call })
      const result = await this.outputParser.parseResult(generations)
      // JSON stringify output. Ref: https://python.langchain.com/docs/modules/chains/additional/openai_functions_retrieval_qa (See conversation QA output)
      return JSON.stringify(result)
    } catch (error) {
      const errorObj = serializeError(error)
      if (errorObj?.message?.includes('Error: No function_call in message')) {
        const result = {
          action: 'error',
          payload: {
            error: errorObj,
          },
        }
        return JSON.stringify(result)
      }
      try {
        const fixedGenerations = await Promise.all(
          generations.map(async (generation: any) => {
            generation.message.additional_kwargs.function_call.arguments = (
              await chain.call({
                input: generation.message.additional_kwargs.function_call.arguments,
              })
            ).text
            return generation
          })
        )
        const result = await this.outputParser.parseResult(fixedGenerations)
        return JSON.stringify(result)
      } catch (error) {
        const result = {
          action: 'error',
          payload: {
            error: serializeError(error),
          },
        }
        return JSON.stringify(result)
      }
    }
  }
}
