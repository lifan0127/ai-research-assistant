import React from 'react'
import MarkdownReact from 'marked-react'

export interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  return <MarkdownReact>{content}</MarkdownReact>
}
