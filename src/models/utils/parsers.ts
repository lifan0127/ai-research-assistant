import { JsonOutputFunctionsParser } from 'langchain/output_parsers'
import { ChatGeneration, Generation } from 'langchain/schema'
import { BaseLLMOutputParser } from 'langchain/schema/output_parser'
import { serializeError } from 'serialize-error'

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
            message: errorObj.message,
            error: errorObj,
          },
        }
        return JSON.stringify(result)
      }
      throw error
    }
  }
}
