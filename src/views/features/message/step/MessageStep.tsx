import React, { useState, useRef } from "react"
import { StepInput } from "./types"
import { Message as OpenAIMessage } from "openai/resources/beta/threads/messages"
import { DocumentIcon } from "@heroicons/react/24/outline"
import * as Markdown from "../widgets/Markdown"
import { parsePartialJson } from "../../../../utils/parsers"
import { Control } from "../../../components/types"
import { Widget, WidgetProps } from "../../../components/Widget"

export interface MessageStepInput extends StepInput {
  type: "MESSAGE_STEP"
  content: OpenAIMessage["content"]
}

export interface MessageStepProps {
  input: MessageStepInput
  control: Control
}

export function MessageStep({ input, control }: MessageStepProps) {
  const { content, status } = input
  const [showRawActionAndContext, setShowRawActionAndContext] = useState(false)
  // Ref to store the last successfully parsed values for each item in the array
  const lastValidMessagesRef = useRef<
    Map<number, { message: string; context?: object; action?: object }>
  >(new Map())

  return (
    <div>
      {content.map((item, index) => {
        switch (item.type) {
          case "text": {
            const parsedValue = parsePartialJson(item.text.value)
            if (parsedValue && parsedValue.message) {
              lastValidMessagesRef.current.set(index, parsedValue)
            }
            const lastValidValue = lastValidMessagesRef.current.get(index)
            if (!lastValidValue) {
              return null
            }
            const { message, context, action } = lastValidValue
            return (
              <>
                <Widget
                  widget="markdown"
                  input={{ content: message }}
                  context={context}
                  control={control}
                />
                {status === "COMPLETED" && (action || context) ? (
                  <div className="px-2">
                    {__env__ === "development" ? (
                      <div>
                        <DocumentIcon
                          title={JSON.stringify({ action, context }, null, 2)}
                          className="h-6 w-6 text-gray-200 absolute right-2"
                          onClick={() =>
                            setShowRawActionAndContext(!showRawActionAndContext)
                          }
                        />
                        {showRawActionAndContext ? (
                          <div className="bg-slate-50 z-10 text-xs absolute right-10">
                            <pre>
                              {JSON.stringify({ action, context }, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <Widget
                      {...(action as Omit<WidgetProps, "control">)}
                      context={context}
                      control={control}
                    />
                  </div>
                ) : null}
              </>
            )
          }
          case "image_file": {
            return <p>Image File ID: {item.image_file.file_id}</p>
          }
        }
      })}
    </div>
  )
}
