import React from 'react'
import MarkdownReact from 'marked-react'
import { marked } from 'marked'
import { createCollection } from '../../../apis/zotero/collection'
import { ARIA_LIBRARY } from '../../../constants'

export interface Props {
  content: string
}

export function Component({ content }: Props) {
  const renderer = {
    link(href: string, title: string, text: string[]) {
      ztoolkit.log({ href, title, text })
      return (
        <button
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

function copy({ content }: Props) {
  const htmlContent = marked(content)
  return new ztoolkit.Clipboard().addText(content, 'text/unicode').addText(htmlContent, 'text/html').copy()
}

async function createNote({ content }: Props) {
  const item = new Zotero.Item('note')
  item.setNote(
    '<div data-schema-version="8">' +
      `<h1>New Note from Aria - ${new Date().toLocaleString()}</h1>` +
      marked(content) +
      '</div>'
  )
  const ariaCollection = await createCollection(ARIA_LIBRARY)
  item.addToCollection(ariaCollection.id)
  await item.saveTx()
}

export const actions = [
  {
    label: 'Copy',
    action: copy,
  },
  {
    label: 'Create Note',
    action: createNote,
  },
]
