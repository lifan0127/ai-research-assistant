import { AgentActionOutputParser } from 'langchain/agents'

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

export class AgentOutputParser extends AgentActionOutputParser {
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
