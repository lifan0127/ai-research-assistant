import React, { useState, useEffect } from "react"
import * as Markdown from "./Markdown"
import { marked } from "marked"
import { DocumentIcon } from "@heroicons/react/24/outline"
import {
  Message as OpenAIMessage,
  MessageDelta,
  MessageContent,
} from "openai/resources/beta/threads/messages"
import { MessageStep, MessageStepInput } from "../steps/MessageStep"
import { ToolStep, ToolStepInput } from "../steps/ToolStep"
import { ErrorStep, ErrorStepInput } from "../steps/ErrorStep"
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
import { Control } from "../../../components/types"
import { NestedQuery } from "../../../../apis/zotero/search"
import stringify from "json-stringify-pretty-compact"
import { CodeHighlighter } from "../../../components/visuals/CodeHighlighter"
import { useAssistant } from "../../../../hooks/useAssistant"
import { BotMessageStatus } from "../../../../typings/legacyMessages"

type StepInput = MessageStepInput | ToolStepInput | ErrorStepInput

export interface Input {
  question: string
  answer?: any
  status: "COMPLETED" | "IN_PROGRESS"
}

export interface Props {
  input: Input
  context: { query: NestedQuery }
  control: Control
}

export function Component({
  input: { question, answer },
  context: { query },
  control,
}: Props) {
  const { save, scrollToEnd } = control
  const [showDevOutput, setShowDevOutput] = useState(false)
  const { assistant } = useAssistant()
  const [status, setStatus] = useState<BotMessageStatus>("begin")
  const [message, setMessage] = useState<MessageContent[]>(answer || [])

  useEffect(() => {
    if (answer) {
      return
    }
    let _messageContent: any[] = []
    const stream = assistant.streamQa(question)

    const handleMessageCreated = (message: OpenAIMessage) => {
      setMessage([])
      setStatus("streaming")
    }

    const handleMessageDelta = (
      _delta: MessageDelta,
      snapshot: OpenAIMessage,
    ) => {
      // console.log(stringify(snapshot.content))
      _messageContent = snapshot.content
      setMessage(_messageContent)
    }

    const handleMessageDone = () => {
      save(_messageContent)
      setStatus("done")
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
  }, [question, answer])

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
      <div>QA Widget: {question}</div>
      <div>Status: {status}</div>
      <div>Message:</div>
      <CodeHighlighter
        code={stringify(message)}
        language="json"
        className="text-sm"
      />
    </div>
  )
  return (
    <div>
      <Markdown.Component input={{ content: answer }} control={control} />
      {sources.length > 0 ? (
        <div className="text-lg">
          <h4 className="p-0 m-0 !mt-4 mb-1 text-tomato">References</h4>
          <ol className="list-none p-0 m-0">
            {sources.map(({ item, attachment, bib }) => {
              return (
                <li key={item.id} className="mb-2 last:mb-0">
                  {bib}
                  <ItemButton item={item} mode="item" />
                  {attachment ? (
                    <ItemButton item={attachment} mode="attachment" />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>
      ) : null}
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
