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
import { ActionType } from "../../../../typings/actions"
import { TextMessageContent } from "../../../../typings/steps"
import { SearchResultsWidget } from "../widgets/SearchResultsWidget"

export interface MessageStepProps {
  content: MessageStepContent
  control: MessageStepControl
}

export function MessageStep({
  content: { id, messageId, status, params },
  control: { updateBotAction, ...restControl },
}: MessageStepProps) {
  log("Render message step", { id, messageId, status, params })
  // Ref to store the last successfully parsed values for each item in the array
  const lastValidMessagesRef = useRef<
    Map<number, { message: string; context?: object; actions?: ActionType[] }>
  >(new Map())
  const [output, setOutput] = useState<any>([])

  function renderTextMessage(
    messageId: string,
    stepId: string,
    { message = "", context = {}, actions = [] }: TextMessageContent["params"],
  ) {
    return (
      <>
        <div className="[&>*]:mx-2 [&_*]:mt-0 [&_*]:leading-7 [&_*]:pb-2 text-lg [&_ul]:ml-[12px] [&_ol]:ml-[12px] [&_ul]:pl-[8px] [&_ol]:pl-[8px] [&_table]:border-solid [&_table]:border-t-2 [&_table]:border-l-0 [&_table]:border-b-2 [&_table]:border-r-0 [&_table]:border-gray-200 [&_table]:mb-4">
          <MarkdownReact renderer={customMarkdownRenderer}>
            {message}
          </MarkdownReact>
        </div>
      </>
    )
  }

  if (!params.messages || params.messages.length === 0) {
    return null
  }

  return (
    <div>
      {params.messages.map((item, index) => {
        switch (item.type) {
          case "TEXT": {
            const { raw, ...structuredMessage } = item.params
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
                  workflows: [],
                })
              }
            }
            return null
          }
          case "IMAGE": {
            return <p>Image File ID: {item.params}</p>
          }
          case "WIDGET": {
            switch (item.params.widget) {
              case "search": {
                return (
                  // <CodeHighlighter
                  //   code={stringify(item.params)}
                  //   language="json"
                  // />
                  <SearchResultsWidget
                    content={{ messageId, ...item }}
                    control={restControl}
                  />
                )
              }
              default: {
                return (
                  <div>
                    <p>Widget: {item.params.widget}</p>
                    <CodeHighlighter
                      code={stringify(item.params)}
                      language="json"
                    />
                  </div>
                )
              }
            }
          }
        }
      })}
    </div>
  )
}
