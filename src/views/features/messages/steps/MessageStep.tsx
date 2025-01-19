import React, { useState, useEffect, useRef } from "react"
import {
  MessageStepContent,
  MessageStepControl,
} from "../../../../typings/steps"
import { Message as OpenAIMessage } from "openai/resources/beta/threads/messages"
import MarkdownReact from "marked-react"
import { parsePartialJson } from "../../../../utils/parsers"
import { Control } from "../../../components/types"
import { customMarkdownRenderer } from "../../../utils/markdown"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import * as Markdown from "../actions/Markdown"
import { SearchAction } from "../actions/SearchAction"
import { QAAction, QAActionContent } from "../actions/QAAction"
import { ErrorAction } from "../actions/ErrorAction"
import { step as log } from "../../../../utils/loggers"
import { Action } from "../../../../typings/actions"
import { TextMessageContent } from "../../../../typings/steps"

export interface MessageStepProps {
  content: MessageStepContent
  control: MessageStepControl
}

export function MessageStep({
  content: { id, messageId, status, messages = [] },
  control: { updateBotAction, ...restControl },
}: MessageStepProps) {
  log("Render message step", { id, messageId, status, messages })
  // Ref to store the last successfully parsed values for each item in the array
  const lastValidMessagesRef = useRef<
    Map<number, { message: string; context?: object; actions?: Action[] }>
  >(new Map())
  const [output, setOutput] = useState<any>([])

  function renderTextMessage(
    messageId: string,
    stepId: string,
    { message = "", context = {}, actions = [] }: TextMessageContent["text"],
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
              actions.map((action: Action) => {
                // return (
                //   <CodeHighlighter language="json" code={stringify(action)} />
                // )
                switch (action.widget) {
                  // case "markdown": {
                  //   return (
                  //     <Markdown.Component
                  //       content={
                  //         {
                  //           status: "IN_PROGRESS",
                  //           ...action.content,
                  //         } as Markdown.Content
                  //       }
                  //       control={restControl}
                  //     />
                  //   )
                  // }
                  case "search": {
                    return (
                      // <CodeHighlighter
                      //   language="json"
                      //   code={stringify({ action, context })}
                      // />
                      <SearchAction
                        content={
                          {
                            messageId,
                            stepId,
                            id: action.id,
                            status: action.status,
                            output: action.output,
                          } as Search.Content
                        }
                        context={context}
                        control={{
                          ...restControl,
                          updateBotAction,
                        }}
                      />
                    )
                  }
                  case "qa": {
                    log("Invoke QA action", { action, context })
                    return (
                      // <CodeHighlighter
                      //   language="json"
                      //   code={stringify(action)}
                      // />
                      <QAAction
                        content={
                          {
                            id: action.id,
                            messageId,
                            stepId,
                            status: "IN_PROGRESS",
                            input: action.input,
                            output: action.output,
                          } as QAActionContent
                        }
                        context={context}
                        control={{
                          ...restControl,
                          updateBotAction,
                        }}
                      />
                    )
                  }
                  // case "error": {
                  //   return (
                  //     <ErrorAction
                  //       input={
                  //         {
                  //           status: "IN_PROGRESS",
                  //           ...action.content,
                  //         } as Error.Content
                  //       }
                  //       control={{
                  //         ...restControl,
                  //       }}
                  //     />
                  //   )
                  // }
                  // default: {
                  //     return (
                  //       <ErrorAction
                  //         input={
                  //           {
                  //             status: "COMPLETED",
                  //             error: new Error(`Invalid widget: ${action.widget}`),
                  //           } as Error.Content
                  //         }
                  //         control={{
                  //           ...restControl,
                  //         }}
                  //       />
                  //     )
                  // }
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
