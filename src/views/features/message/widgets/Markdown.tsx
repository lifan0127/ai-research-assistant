import React, { useEffect } from "react"
import MarkdownReact from "marked-react"
import { marked } from "marked"
import { config } from "../../../../../package.json"
import {
  annotationButtonDef,
  copyButtonDef,
  noteButtonDef,
} from "../../../components/buttons/types"
import { customMarkdownRenderer } from "../../../utils/markdown"
import { Control } from "../../../components/types"

export interface Input {
  content: string
}

export interface Props {
  input: Input
  control: Control
}

export function Component({
  input: { content },
  control: { scrollToEnd },
}: Props) {
  const renderer = {
    link(href: string, title: string, text: string[]) {
      return (
        <button
          key={text + href}
          className="text-tomato p-0 border-none bg-transparent hover:underline hover:cursor-pointer"
          title={title}
          onClick={() => Zotero.launchURL(href)}
        >
          {text && text.length > 0 ? text[0] : href}
        </button>
      )
    },
  }
  useEffect(() => {
    scrollToEnd()
  }, [content])

  return (
    <div className="[&>*]:mx-2 [&_*]:mt-0 [&_*]:leading-7 [&_*]:pb-2 text-lg [&_ul]:ml-[12px] [&_ol]:ml-[12px] [&_ul]:pl-[8px] [&_ol]:pl-[8px] [&_table]:border-solid [&_table]:border-t-2 [&_table]:border-l-0 [&_table]:border-b-2 [&_table]:border-r-0 [&_table]:border-gray-200 [&_table]:mb-4">
      <MarkdownReact renderer={customMarkdownRenderer}>{content}</MarkdownReact>
    </div>
  )
}

export function compileContent({ input: { content: textContent } }: Props) {
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

async function createNote(props: Props) {
  const { htmlContent } = compileContent(props)
  const note =
    '<div data-schema-version="8">' +
    `<h1>New Note from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
    htmlContent +
    "</div>"
  return note
}

function createAnnotation(props: Props) {
  const { textContent } = compileContent(props)
  return textContent
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
  {
    name: "ANNOTATION",
    utils: { createAnnotation },
  } as annotationButtonDef,
]
