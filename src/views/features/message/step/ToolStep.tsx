import React, { useEffect, useRef, useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid"
import stringify from "json-stringify-pretty-compact"
import { StepInput } from "./types"
import { Control } from "../../../components/types"
import { ZoteroIcon } from "../../../icons/zotero"
import { runFunctionTool } from "../../../../models/tools"
import { CodeHighlighter } from "../../../components/visuals/CodeHighlighter"
import { tools } from "../../../../models/tools"
import { CSSTransition } from "react-transition-group"

export interface ToolStepInput extends StepInput {
  type: "TOOL_STEP"
  tool: string
  toolArguments: string
}

export interface ToolStepProps {
  input: ToolStepInput
  control: Control
}

export function ToolStep({ input, control }: ToolStepProps) {
  const { id, tool, toolArguments: toolArgumentsString } = input
  const toolArguments = JSON.parse(toolArgumentsString)
  const [output, setOutput] = useState<string>()
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  const toolInfo =
    tools[tool as "search_tag" | "search_creator" | "search_item"]
  const { scrollToEnd, pauseScroll, addFunctionCallOutput } = control

  useEffect(() => {
    const runTool = async () => {
      const output = (await runFunctionTool(tool, toolArguments)) || "No output"
      addFunctionCallOutput(id, output)
      setOutput(() => output)
      scrollToEnd()
    }
    runTool()
  }, [input])

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    setExpanded(!expanded)
    pauseScroll()
  }

  return (
    <div style={{ width: "fit-content" }}>
      <span className="mr-2">
        <ZoteroIcon pulsing={!output} />
      </span>
      <a
        href="#"
        onClick={handleClick}
        className="border-none bg-transparent m-0 p-0 text-black align-middle text-lg"
        style={{ textDecorationLine: "none" }}
      >
        Using tool <span className="font-bold">{toolInfo.title}</span>
        {output ? (
          expanded ? (
            <ChevronUpIcon className="h-6 w-6 align-middle" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 align-middle" />
          )
        ) : null}
      </a>
      <CSSTransition
        nodeRef={ref}
        in={expanded}
        timeout={200}
        classNames="penal-24"
        unmountOnExit
      >
        <div ref={ref} className="px-6 py-4 rounded-md bg-white text-base my-1">
          <div>{toolInfo.description}</div>
          <div className="max-h-60 overflow-auto">
            <CodeHighlighter
              code={stringify(toolArguments)}
              language="json"
              className="text-sm"
            />
          </div>
          {output ? (
            <>
              <div>The following response was used:</div>
              <div className="max-h-60 overflow-auto">
                <pre
                  className="bg-amber-50 p-2"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {output}
                </pre>
              </div>
            </>
          ) : (
            <div>Waiting for response...</div>
          )}
        </div>
      </CSSTransition>
    </div>
  )
}
