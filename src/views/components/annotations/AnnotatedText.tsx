import React, { useState, useEffect } from "react"
import { Text } from "openai/resources/beta/threads/messages"
import MarkdownReact from "marked-react"
import { customMarkdownRenderer } from "../../utils/markdown"
import { useAssistant } from "../../../hooks/useAssistant"
import { ItemButton } from "../buttons/ItemButton"
import { action as log } from "../../../utils/loggers"

interface CitationEntryProps {
  metadata: any
  handleHyperlinkClick: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

function CitationEntry({ metadata, handleHyperlinkClick }: CitationEntryProps) {
  const splits = metadata.bib.split(" ")
  return (
    <>
      {splits.map((word: string, index: number) => {
        const isLink = word.startsWith("http")
        const isLinkEndsWithPeriod = isLink && word.endsWith(".")
        const isLast = index === splits.length - 1
        const displayWord = isLinkEndsWithPeriod ? word.slice(0, -1) : word
        return (
          <>
            {isLink ? (
              isLinkEndsWithPeriod ? (
                <>
                  <a
                    key={metadata.itemId + `${index}`}
                    href={displayWord}
                    onClick={handleHyperlinkClick}
                  >
                    {displayWord}
                  </a>
                  .
                </>
              ) : (
                <a
                  key={metadata.itemId + `${index}`}
                  href={displayWord}
                  onClick={handleHyperlinkClick}
                >
                  {displayWord}
                </a>
              )
            ) : (
              <span key={metadata.itemId + `${index}`}>{word} </span>
            )}
            {isLast ? null : " "}
          </>
        )
      })}
      <ItemButton
        item={{ id: metadata.itemId, type: metadata.itemType }}
        mode="item"
      />
      <ItemButton
        item={{
          id: metadata.attachmentId,
          type: metadata.attachmentType,
        }}
        mode="attachment"
      />
    </>
  )
}

interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="[&_*]:mt-0 [&_*]:leading-7 [&_*]:pb-2 text-lg [&_ul]:ml-[12px] [&_ol]:ml-[12px] [&_ul]:pl-[8px] [&_ol]:pl-[8px] [&_table]:border-solid [&_table]:border-t-2 [&_table]:border-l-0 [&_table]:border-b-2 [&_table]:border-r-0 [&_table]:border-gray-200 [&_table]:mb-4">
      <MarkdownReact renderer={customMarkdownRenderer}>{content}</MarkdownReact>
    </div>
  )
}

interface AnnotatedTextProps {
  textContent: Text
}

export function AnnotatedText({
  textContent: { value, annotations },
}: AnnotatedTextProps) {
  const { assistant } = useAssistant()
  const [text, setText] = useState<string>("")
  const [citations, setCitations] = useState<any[]>([])

  useEffect(() => {
    async function parse() {
      const { text, citations } = await assistant.parseAnnotatedText({
        value,
        annotations,
      })
      setText(text)
      setCitations(citations)
    }
    parse()
  }, [value, annotations])

  function handleHyperlinkClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    const href = event.currentTarget.getAttribute("href")
    if (href) {
      Zotero.launchURL(href)
    }
  }

  log("Annotated text", { text, citations })
  return (
    <>
      <Markdown content={text} />
      {citations.length > 0 ? (
        <div className="text-lg">
          <h4 className="p-0 m-0 !mt-4 mb-1 text-tomato">References</h4>
          <ol className="list-decimal m-0">
            {citations.map(({ metadata }) => {
              return (
                <li key={metadata.itemId} className="mb-2 last:mb-0">
                  <CitationEntry
                    metadata={metadata}
                    handleHyperlinkClick={handleHyperlinkClick}
                  />
                </li>
              )
            })}
          </ol>
        </div>
      ) : null}
    </>
  )
}
