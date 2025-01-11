import { useState, useCallback } from "react"
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs"
import { tool as log } from "../utils/loggers"

export function useFunctionCalls() {
  const [functionCalls, setFunctionCalls] = useState<
    RunSubmitToolOutputsParams.ToolOutput[]
  >([])
  const [functionCallsCount, setFunctionCallsCount] = useState<number>(0)

  const addFunctionCallOutput = useCallback(
    (tool_call_id: string, output: string) => {
      log("Add function call output", { functionCalls, tool_call_id, output })
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
    },
    [functionCalls, setFunctionCalls],
  )

  const clearFunctionCalls = useCallback(() => {
    setFunctionCalls([])
    setFunctionCallsCount(0)
  }, [setFunctionCalls, setFunctionCallsCount])

  const functionCallsFulfilled = useCallback(() => {
    return (
      functionCalls.length > 0 &&
      functionCalls.length === functionCallsCount &&
      functionCalls.every((functionCall) => functionCall.output)
    )
  }, [functionCalls, functionCallsCount])

  return {
    functionCalls,
    functionCallsFulfilled,
    setFunctionCalls,
    setFunctionCallsCount,
    addFunctionCallOutput,
    clearFunctionCalls,
  }
}
