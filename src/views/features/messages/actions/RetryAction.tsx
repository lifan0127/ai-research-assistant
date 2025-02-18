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
import { RetryActionStepControl, QueryType } from "../../../../typings/actions"
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
import { MentionValue } from "../../../../typings/input"
import { RetryActionStepContent } from "../../../../typings/steps"

type StepContent = MessageStepContent | ToolStepContent | ErrorStepContent

export interface RetryActionProps {
  content: RetryActionStepContent
  context: { query: QueryType }
  control: RetryActionStepControl
}

export const RetryAction = memo(function RetryActionComponent({
  content: {
    messageId,
    id,
    params: {
      action: {
        input: { message, prompt },
      },
      context,
      workflow,
    },
  },
  control: {
    addUserMessage,
    addBotMessage,
    scrollToEnd,
    updateBotAction,
    pauseScroll,
  },
}: RetryActionProps) {
  const { assistant } = useAssistant()

  function handleConfirm() {
    const states = {
      items: [],
      collections: [],
      creators: [],
      tags: [],
      images: [],
    }
    const stream = assistant.streamMessage(prompt, states)
    addBotMessage({
      stream: stream,
      steps: [],
    })
  }

  function handleCancel() {}

  return (
    <div className="w-auto max-w-full sm:max-w-[75%]">
      <div className="bg-white px-4 py-2 border border-neutral-500 rounded shadow-md text-black break-words my-2">
        <div>{message} Would you like me to try again?</div>
        <div className="mt-2 sm:mt-4 flex flex-col md:flex-row w-full space-y-4 md:space-x-4 md:space-y-0">
          <button
            type="button"
            className="flex-auto rounded-md bg-tomato px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button
            type="button"
            className="flex-auto rounded-md bg-neutral-400 px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
})
