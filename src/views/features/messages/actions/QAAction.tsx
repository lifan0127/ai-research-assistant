import React, { useState, useEffect, useMemo, useRef, memo } from "react"
import { marked } from "marked"
import { DocumentIcon } from "@heroicons/react/24/outline"
import {
  Message as OpenAIMessage,
  MessageDelta,
  MessageContent,
} from "openai/resources/beta/threads/messages"
import { MessageStep, MessageStepContent } from "../steps/MessageStep"
import { ToolStep, ToolStepContent } from "../steps/ToolStep"
import { ErrorStep, ErrorStepContent } from "../steps/ErrorStep"
import { createCitations } from "../../../../apis/zotero/citation"
import { ItemButton } from "../../../components/buttons/ItemButton"
import { createCollection } from "../../../../apis/zotero/collection"
import { ARIA_LIBRARY } from "../../../../utils/constants"
import { config } from "../../../../../package.json"
import {
  annotationButtonDef,
  copyButtonDef,
  noteButtonDef,
} from "../../../components/buttons/types"
import { QAActionStepControl, QueryType } from "../../../../typings/actions"
import stringify from "json-stringify-pretty-compact"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import { useAssistant } from "../../../../hooks/useAssistant"
import {
  AnnotatedText,
  Markdown,
} from "../../../components/annotations/AnnotatedText"
import { action as log } from "../../../../utils/loggers"
import { recursiveSearch } from "../../../../apis/zotero/search"
import { getItemsAndIndexAttachments } from "../../../../apis/zotero/item"
import type {
  FileForIndexing,
  FilePreparationStatus,
} from "../../../../typings/files"
import { FileUploadIcon, FileIndexIcon } from "../../../icons/file"
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid"
import { FileStatus } from "../../../components/files/FileStatus"
import { FilePreparation } from "../../../components/files/FirePreparation"
import { QAActionStepContent } from "../../../../typings/steps"

export interface QAActionProps {
  content: QAActionStepContent
  context: { query: QueryType }
  control: QAActionStepControl
}

export const QAAction = memo(function QAActionComponent({
  content: {
    messageId,
    id,
    params: {
      action: {
        input: { question, fulltext },
        output,
      },
      workflow,
    },
  },
  control: { scrollToEnd, updateBotStep, pauseScroll },
}: QAActionProps) {
  const { assistant } = useAssistant()
  log("QA Output", output)
  useEffect(() => {
    if (output) {
      return
    }

    const stream = assistant.streamQA(question)

    const handleMessageCreated = (message: OpenAIMessage) => {
      // setStatus("streaming")
    }

    const handleMessageDelta = (
      _delta: MessageDelta,
      snapshot: OpenAIMessage,
    ) => {
      updateBotStep(messageId, id, {
        params: {
          action: {
            type: "qa",
            input: { question, fulltext },
            output: snapshot.content,
          },
        },
      })
      snapshot.content
        .filter((x) => x.type === "text")
        .map((x) => {
          assistant
            .parseAnnotatedText(x.text)
            .then((parsed) => log("Parse Annotated Text", parsed))
        })
      // _messageContent = snapshot.content
      // setMessage(_messageContent)
    }

    const handleMessageDone = () => {
      // setStatus("done")
      log("QA stream done")
      updateBotStep(messageId, id, {
        status: "COMPLETED",
      })
      updateBotStep(workflow.messageId, workflow.stepId, {
        status: "COMPLETED",
      })
    }

    stream
      .on("messageCreated", handleMessageCreated)
      .on("messageDelta", handleMessageDelta)
      .on("messageDone", handleMessageDone)

    return () => {
      log("unmount")
      stream
        .off("messageCreated", handleMessageCreated)
        .off("messageDelta", handleMessageDelta)
        .off("messageDone", handleMessageDone)
    }
  }, [question, fulltext])

  // if (!searchResults) {
  //   return (
  //     <div className="p-[15px]">
  //       <div className="dot-flashing "></div>
  //       <div>Searching your Zotero libraries ...</div>
  //     </div>
  //   )
  // }
  // log("Search results", searchResults)

  // log("QA output", output)
  // return <pre>{JSON.stringify(output)}</pre>

  if (!output) {
    return (
      <div className="p-[15px]">
        <div className="dot-flashing "></div>
      </div>
    )
  }

  return (
    <div className="bg-white px-4 py-2 border border-neutral-500 rounded shadow-md text-black break-words my-2">
      {output.map((item: MessageContent, index: number) => {
        switch (item.type) {
          case "text": {
            return <AnnotatedText key={index} textContent={item.text} />
          }
          default: {
            new Error(`Unsupported message type: ${item.type}`)
          }
        }
      })}
    </div>
  )
})
