import React from 'react'
import MarkdownReact from 'marked-react'
import { marked } from 'marked'
import { createCollection } from '../../../apis/zotero/collection'
import { ARIA_LIBRARY } from '../../../constants'
import { config } from '../../../../package.json'

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
  const item = new Zotero.Item('note')
  item.setNote(
    '<div data-schema-version="8">' +
      `<h1>New Note from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
      htmlContent +
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
