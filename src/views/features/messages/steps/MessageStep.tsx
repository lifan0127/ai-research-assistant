import React, { useState, useEffect, useRef } from "react"
import {
  MessageStepInput,
  MessageStepControl,
  StructuredMessage,
} from "../../../../typings/steps"
import { Message as OpenAIMessage } from "openai/resources/beta/threads/messages"
import MarkdownReact from "marked-react"
import { parsePartialJson } from "../../../../utils/parsers"
import { Control } from "../../../components/types"
import { Widget, WidgetProps } from "../actions/Widget"
import { customMarkdownRenderer } from "../../../utils/markdown"
import { CodeHighlighter } from "../../../components/visuals/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import * as Markdown from "../actions/Markdown"
import * as Search from "../actions/Search"
import * as QA from "../actions/QA"
import * as Error from "../actions/Error"

export interface MessageStepProps {
  input: MessageStepInput
  control: MessageStepControl
}

export function MessageStep({
  input: { id, messageId, status, messages = [] },
  control: { save, updateBotAction, ...restControl },
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
    save({ content: updatedOutput })
  }

  function renderTextMessage(
    messageId: string,
    stepId: string,
    { message = "", context = {}, actions = [] }: Partial<StructuredMessage>,
  ) {
    return (
      <>
        <div className="[&>*]:mx-2 [&_*]:mt-0 [&_*]:leading-7 [&_*]:pb-2 text-lg [&_ul]:ml-[12px] [&_ol]:ml-[12px] [&_ul]:pl-[8px] [&_ol]:pl-[8px] [&_table]:border-solid [&_table]:border-t-2 [&_table]:border-l-0 [&_table]:border-b-2 [&_table]:border-r-0 [&_table]:border-gray-200 [&_table]:mb-4">
          <MarkdownReact renderer={customMarkdownRenderer}>
            {message}
          </MarkdownReact>
        </div>
        {status === "COMPLETED" && (actions.length || context) ? (
          <div className="px-2">
            {
              actions.map((action: any) => {
                switch (action.widget) {
                  case "markdown": {
                    return (
                      <Markdown.Component
                        input={
                          {
                            status: "IN_PROGRESS",
                            ...action.input,
                          } as Markdown.Input
                        }
                        control={{
                          ...restControl,
                          save: saveStepWidget,
                        }}
                      />
                    )
                  }
                  case "search": {
                    console.log({ searchAction: action })
                    return (
                      <Search.Component
                        input={
                          {
                            id: action.id,
                            messageId,
                            stepId,
                            status: "IN_PROGRESS",
                            ...action,
                          } as Search.Input
                        }
                        context={context}
                        control={{
                          ...restControl,
                          updateBotAction,
                          save: saveStepWidget,
                        }}
                      />
                    )
                  }
                  case "error": {
                    return (
                      <Error.Component
                        input={
                          {
                            status: "IN_PROGRESS",
                            ...action.input,
                          } as Error.Input
                        }
                        control={{
                          ...restControl,
                          save: saveStepWidget,
                        }}
                      />
                    )
                  }
                  case "qa": {
                    return (
                      <QA.Component
                        input={
                          { status: "IN_PROGRESS", ...action.input } as QA.Input
                        }
                        context={context}
                        control={{
                          ...restControl,
                          updateBotAction,
                          save: saveStepWidget,
                        }}
                      />
                    )
                  }
                  default: {
                    return (
                      <Markdown.Component
                        input={{
                          content: `Unknown widget: ${widget}. Input: ${JSON.stringify(input)}`,
                        }}
                        control={control}
                      />
                    )
                  }
                }
              })
              // <Widget
              //   widget={action.widget}
              //   input={{ status: "IN_PROGRESS", ...action.input }}
              //   context={context}
              //   control={{
              //     ...restControl,
              //     updateBotAction,
              //     save: saveStepWidget,
              //   }}
              // />
            }
          </div>
        ) : null}
      </>
    )
  }

  return (
    <div>
      {messages.map((item, index) => {
        switch (item.type) {
          case "TEXT": {
            const { raw, ...structuredMessage } = item.text
            if (structuredMessage.message) {
              console.log("render structured message", structuredMessage)
              return renderTextMessage(messageId, id, structuredMessage)
            }
            if (raw) {
              const parsedValue = parsePartialJson(raw.value)
              if (parsedValue?.message) {
                lastValidMessagesRef.current.set(index, parsedValue)
              }
              const lastValidValue = lastValidMessagesRef.current.get(index)
              if (lastValidValue) {
                return renderTextMessage(messageId, id, {
                  message: lastValidValue.message,
                  context: {},
                  actions: [],
                })
              }
            }
            return null
          }
          case "IMAGE": {
            return <p>Image File ID: {item.image}</p>
          }
        }
      })}
    </div>
  )
}
