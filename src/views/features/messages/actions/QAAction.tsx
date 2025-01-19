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
import { QAActionControl, Query } from "../../../../typings/actions"
import stringify from "json-stringify-pretty-compact"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import { useAssistant } from "../../../../hooks/useAssistant"
import { BotMessageStatus } from "../../../../typings/legacyMessages"
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

type StepContent = MessageStepContent | ToolStepContent | ErrorStepContent

export interface QAActionContent {
  status: "COMPLETED" | "IN_PROGRESS"
  id: string
  messageId: string
  stepId: string
  input: {
    question: string
    fulltext: boolean
  }
  output?: any
}

export interface QAActionProps {
  content: QAActionContent
  context: { query: Query }
  control: QAActionControl
}

export const QAAction = memo(function QAActionComponent({
  content: {
    messageId,
    stepId,
    id,
    input: { question, fulltext },
    output,
  },
  context: { query },
  control: { scrollToEnd, updateBotAction, pauseScroll },
}: QAActionProps) {
  const { assistant } = useAssistant()
  const [fulltextReady, setFullTextReady] = useState(false)
  const [useFulltext, setUseFulltext] = useState(fulltext)
  const [files, setFiles] = useState<FileForIndexing[]>()

  useEffect(() => {
    async function searchZotero(query: Query | undefined) {
      if (query) {
        const itemIds = await recursiveSearch(query)
        const results = await getItemsAndIndexAttachments(
          itemIds,
          assistant.currentVectorStore!,
        )
        setFiles(results)
      }
    }
    if (!output) {
      searchZotero(query as Query)
    }
  }, [query])

  useEffect(() => {
    if (output) {
      return
    }

    if (fulltext && !fulltextReady) {
      return
    }
    log("create QA stream")
    const stream = assistant.streamQA(question)

    const handleMessageCreated = (message: OpenAIMessage) => {
      // setStatus("streaming")
    }

    const handleMessageDelta = (
      _delta: MessageDelta,
      snapshot: OpenAIMessage,
    ) => {
      updateBotAction(messageId, stepId, id, {
        output: snapshot.content,
      })
      log(stringify({ messageId, stepId, id, output: snapshot.content }))
      // _messageContent = snapshot.content
      // setMessage(_messageContent)
    }

    const handleMessageDone = () => {
      // setStatus("done")
      log("QA stream done")
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
  }, [question, fulltext, fulltextReady])

  function handleFullTextComplete() {
    setFullTextReady(true)
  }

  // if (!searchResults) {
  //   return (
  //     <div className="p-[15px]">
  //       <div className="dot-flashing "></div>
  //       <div>Searching your Zotero libraries ...</div>
  //     </div>
  //   )
  // }
  // log("Search results", searchResults)

  if (fulltext && Array.isArray(files) && files.length === 0) {
    return <Markdown content={"No available files to answer this question."} />
  }

  // log("QA output", output)
  // return <pre>{JSON.stringify(output)}</pre>
  return (
    <div>
      {fulltext && !fulltextReady && files ? (
        <FilePreparation
          files={files}
          onComplete={handleFullTextComplete}
          pauseScroll={pauseScroll}
        />
      ) : null}
      {/* <CodeHighlighter
        code={stringify({ ...output })}
        language="json"
        className="text-sm"
      /> */}
      {output ? (
        <div>
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
      ) : null}
    </div>
  )
})

export function compileContent({
  input: { answer, sources = [] },
}: QAActionProps) {
  const textContent =
    sources.length === 0
      ? answer
      : `
${answer}

#### References

${sources.map(({ bib }) => bib).join("\n")}
  `.trim()
  const htmlContent = marked(textContent)
  return { textContent, htmlContent }
}

function copy(props: QAActionProps) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard()
    .addText(textContent, "text/unicode")
    .addText(htmlContent, "text/html")
    .copy()
}

async function createNote({ input: { answer, sources } }: QAActionProps) {
  const sourceIds = sources.map(({ item }) => item.id)
  const sourceItems = await Zotero.Items.getAsync(sourceIds)
  const citations = sourceItems.map((item) => ({
    uris: [Zotero.URI.getItemURI(item)],
    itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
  }))
  const sourcesContent = `
  <ol>
${sourceItems
  .map((item, i) => {
    const citation = {
      uris: [Zotero.URI.getItemURI(item)],
      itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
    }
    const citationPreview = Zotero.EditorInstanceUtilities.formatCitation({
      citationItems: [citation],
    })
    const citationData = {
      citationItems: [{ uris: citation.uris }],
      properties: {},
    }
    const citationKey = `<span class="citation" data-citation="${encodeURIComponent(
      JSON.stringify(citationData),
    )}">(<span class="citation-item">${citationPreview}</span>)</span>`
    return `<li>${citationKey} ${sources[i].bib.replace(/\(\d+\)\s+/, "")}</li>`
  })
  .join("\n")}
</ol>
  `.trim()
  const content =
    sources.length === 0
      ? marked(answer)
      : `
${marked(answer)}

<h2>References</h2>

${sourcesContent}`.trim()
  const note =
    '<div data-schema-version="8">' +
    `<h1>New Q&A Response from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
    content +
    "</div>"
  return note
}

export const buttonDefs = [
  {
    name: "COPY",
    utils: { copy },
  } as copyButtonDef,
  {
    name: "NOTE",
    utils: { createNote },
  } as noteButtonDef,
]
