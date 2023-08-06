import React from 'react'
import MarkdownReact from 'marked-react'
import { marked } from 'marked'

export interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  return <MarkdownReact>{content}</MarkdownReact>
}

export function copyMarkdown({ content }: MarkdownProps) {
  const htmlContent = marked(content)
  return new ztoolkit.Clipboard().addText(content, 'text/unicode').addText(htmlContent, 'text/html').copy()
}
