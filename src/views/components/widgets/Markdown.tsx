import React from 'react'
import MarkdownReact from 'marked-react'
import { marked } from 'marked'

export interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
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

export function copyMarkdown({ content }: MarkdownProps) {
  const htmlContent = marked(content)
  return new ztoolkit.Clipboard().addText(content, 'text/unicode').addText(htmlContent, 'text/html').copy()
}
