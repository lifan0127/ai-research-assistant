import React, { useState, useEffect, useMemo } from "react"
import * as Markdown from "./Markdown"
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
import { NestedQuery, nestedSearch } from "../../../../apis/zotero/search"
import stringify from "json-stringify-pretty-compact"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import { useAssistant } from "../../../../hooks/useAssistant"
import { BotMessageStatus } from "../../../../typings/legacyMessages"
import { AnnotatedText } from "../../../components/annotations/AnnotatedText"

type StepContent = MessageStepContent | ToolStepContent | ErrorStepContent

export interface Content {
  status: "COMPLETED" | "IN_PROGRESS"
  id: string
  messageId: string
  stepId: string
  question: string
  fulltext: boolean
  output?: any
}

export interface Props {
  content: Content
  context: { query: NestedQuery }
  control: QAActionControl
}

export function Component({
  content: { messageId, stepId, id, question, fulltext, output },
  context: { query },
  control: { scrollToEnd, updateBotAction },
}: Props) {
  const [showDevOutput, setShowDevOutput] = useState(false)
  const { assistant } = useAssistant()
  const [fulltextReady, setFullTextReady] = useState(false)
  const [searchResults, setSearchResults] =
    useState<Awaited<ReturnType<typeof nestedSearch>>>()
  const [useFulltext, setUseFulltext] = useState(fulltext)

  useEffect(() => {
    async function searchZotero(query: Query | undefined) {
      if (query) {
        setSearchResults(await nestedSearch(query, "qa"))
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

    const stream = assistant.streamQA(question)

    const handleMessageCreated = (message: OpenAIMessage) => {
      // setStatus("streaming")
    }

    const handleMessageDelta = (
      _delta: MessageDelta,
      snapshot: OpenAIMessage,
    ) => {
      updateBotAction(messageId, stepId, id, { output: snapshot.content })
      // console.log(stringify(snapshot.content))
      // _messageContent = snapshot.content
      // setMessage(_messageContent)
    }

    const handleMessageDone = () => {
      // setStatus("done")
    }

    stream
      .on("messageCreated", handleMessageCreated)
      .on("messageDelta", handleMessageDelta)
      .on("messageDone", handleMessageDone)

    return () => {
      stream
        .off("messageCreated", handleMessageCreated)
        .off("messageDelta", handleMessageDelta)
        .off("messageDone", handleMessageDone)
    }
  }, [question, output, useFulltext])

  if (!output) {
    return (
      <div className="p-[15px]">
        <div className="dot-flashing "></div>
      </div>
    )
  }

  return (
    <div>
      {__env__ === "development" ? (
        <div>
          <DocumentIcon
            title={JSON.stringify({ question, query }, null, 2)}
            className="h-6 w-6 text-gray-200 absolute right-2"
            onClick={() => setShowDevOutput(!showDevOutput)}
          />
          {showDevOutput ? (
            <div className="bg-slate-50 z-10 text-xs absolute right-10">
              <CodeHighlighter
                code={stringify({ question, query })}
                language="json"
                className="text-sm"
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <CodeHighlighter
        code={stringify(output)}
        language="json"
        className="text-sm"
      />
      <div>
        {output.map((item, index) => {
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
    </div>
  )
}

export function compileContent({ input: { answer, sources = [] } }: Props) {
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

function copy(props: Props) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard()
    .addText(textContent, "text/unicode")
    .addText(htmlContent, "text/html")
    .copy()
}

async function createNote({ input: { answer, sources } }: Props) {
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
