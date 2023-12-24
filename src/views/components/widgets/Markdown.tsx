import React from 'react'
import MarkdownReact from 'marked-react'
import { marked } from 'marked'
import { config } from '../../../../package.json'
import { annotationButtonDef, copyButtonDef, noteButtonDef } from '../buttons/types'
export interface Props {
  content: string
}

export function Component({ content }: Props) {
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
  return <MarkdownReact renderer={renderer as any}>{content}</MarkdownReact>
}

export function compileContent({ content: textContent }: Props) {
  const htmlContent = marked(textContent)
  return { textContent, htmlContent }
}

function copy(props: Props) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}

async function createNote(props: Props) {
  const { htmlContent } = compileContent(props)
  const note =
    '<div data-schema-version="8">' +
    `<h1>New Note from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
    htmlContent +
    '</div>'
  return note
}

function createAnnotation(props: Props) {
  const { textContent } = compileContent(props)
  return textContent
}

export const buttonDefs = [
  {
    name: 'COPY',
    utils: { copy },
  } as copyButtonDef,
  {
    name: 'NOTE',
    utils: { createNote },
  } as noteButtonDef,
  {
    name: 'ANNOTATION',
    utils: { createAnnotation },
  } as annotationButtonDef,
]
