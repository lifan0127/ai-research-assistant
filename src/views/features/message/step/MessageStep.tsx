import React, { useState, useEffect, useRef } from "react"
import { StepInput } from "../../../../typings/steps"
import { Message as OpenAIMessage } from "openai/resources/beta/threads/messages"
import MarkdownReact from "marked-react"
import { parsePartialJson } from "../../../../utils/parsers"
import { Control } from "../../../components/types"
import { Widget, WidgetProps } from "../../../components/Widget"
import { customMarkdownRenderer } from "../../../utils/markdown"
import { MessageStepInput } from "../../../../typings/steps"

export interface MessageStepProps {
  input: MessageStepInput
  control: Control
}

export function MessageStep({
  input: { messages = [] },
  control: { save, ...restControl },
}: MessageStepProps) {
  // Ref to store the last successfully parsed values for each item in the array
  const lastValidMessagesRef = useRef<
    Map<number, { message: string; context?: object; actions?: object[] }>
  >(new Map())
  const [output, setOutput] = useState<any>([])

  function saveStepWidget(widgetContent: any) {
    console.log({ widgetContent })
    const updatedOutput = [...output, widgetContent]
    setOutput((output: any) => updatedOutput)
    save({ ...input, content: updatedOutput })
  }

  return (
    <div>
      {messages.map((item, index) => {
        switch (item.type) {
          case "TEXT": {
            return <pre>{item.text.message}</pre>
            const parsedValue = parsePartialJson(item.text.message)
            if (parsedValue && parsedValue.message) {
              lastValidMessagesRef.current.set(index, parsedValue)
            }
            const lastValidValue = lastValidMessagesRef.current.get(index)
            console.log({ item: item.text.value, parsedValue, lastValidValue })
            if (!lastValidValue) {
              return null
            }
            const { message, context, actions = [] } = lastValidValue
            return (
              <>
                <div className="[&>*]:mx-2 [&_*]:mt-0 [&_*]:leading-7 [&_*]:pb-2 text-lg [&_ul]:ml-[12px] [&_ol]:ml-[12px] [&_ul]:pl-[8px] [&_ol]:pl-[8px] [&_table]:border-solid [&_table]:border-t-2 [&_table]:border-l-0 [&_table]:border-b-2 [&_table]:border-r-0 [&_table]:border-gray-200 [&_table]:mb-4">
                  <MarkdownReact renderer={customMarkdownRenderer}>
                    {message}
                  </MarkdownReact>
                </div>
                {status === "COMPLETED" && (actions.length || context) ? (
                  <div className="px-2">
                    {actions.map((action: any) => (
                      <Widget
                        widget={action.widget}
                        input={{ status: "IN_PROGRESS", ...action.input }}
                        context={context}
                        control={{ ...restControl, save: saveStepWidget }}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )
          }
          case "IMAGE": {
            return <p>Image File ID: {item.image_file.file_id}</p>
          }
        }
      })}
    </div>
  )
}
