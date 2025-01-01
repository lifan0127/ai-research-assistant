import { useState } from "react"
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs"

export function useFunctionCalls() {
  const [functionCalls, setFunctionCalls] = useState<
    RunSubmitToolOutputsParams.ToolOutput[]
  >([])
  const [functionCallsCount, setFunctionCallsCount] = useState<number>(0)

  function addFunctionCallOutput(tool_call_id: string, output: string) {
    console.log("add function call output from step")
    console.log({ functionCalls, tool_call_id, output })
    const functionCall = functionCalls.find(
      (fc) => fc.tool_call_id === tool_call_id,
    )
    if (functionCall) {
      functionCall.output = output
      functionCalls.map(() => [...functionCalls])
    } else {
      setFunctionCalls((functionCalls) => [
        ...functionCalls,
        { tool_call_id, output },
      ])
    }
  }

  function clearFunctionCalls() {
    setFunctionCalls([])
    setFunctionCallsCount(0)
  }

  function functionCallsFulfilled() {
    return (
      functionCalls.length > 0 &&
      functionCalls.length === functionCallsCount &&
      functionCalls.every((functionCall) => functionCall.output)
    )
  }

  return {
    functionCalls,
    functionCallsFulfilled,
    setFunctionCalls,
    setFunctionCallsCount,
    addFunctionCallOutput,
    clearFunctionCalls,
  }
}
