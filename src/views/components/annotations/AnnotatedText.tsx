import React from "react"
import { Text } from "openai/resources/beta/threads/messages"
import MarkdownReact from "marked-react"
import { customMarkdownRenderer } from "../../utils/markdown"
import { FileObject } from "openai/resources"

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
  if (!annotations || annotations.length === 0) {
    return <Markdown content={value} />
  }

  const content = []
  let currentIndex = 0

  annotations.forEach((annotation, index) => {
    if (annotation.start_index > currentIndex) {
      content.push(value.slice(currentIndex, annotation.start_index))
    }

    if (annotation.type === "file_citation") {
      content.push(
        `[${annotation.text}](#file-${annotation.file_citation.file_id})`,
      )
    } else {
      // Fallback for other annotation types
      content.push(
        <span key={`annotation-${index}`} className="font-bold">
          {annotation.text}
        </span>,
      )
    }

    // Move past this annotation
    currentIndex = annotation.end_index
  })

  // Any remaining text after the last annotation
  if (currentIndex < value.length) {
    content.push(<span key="text-end">{value.slice(currentIndex)}</span>)
  }

  return <Markdown content={content.join()} />
}
