import React from "react"
import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json"
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript"
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python"
import docco from "react-syntax-highlighter/dist/esm/styles/hljs/docco"

SyntaxHighlighter.registerLanguage("javascript", js)
SyntaxHighlighter.registerLanguage("json", json)
SyntaxHighlighter.registerLanguage("python", python)

export interface CodeHighlighterProps {
  code: string
  language: "json" | "javascript" | "python"
  className?: string
}

export function CodeHighlighter({
  code,
  language,
  className,
}: CodeHighlighterProps) {
  return (
    <div className={className}>
      <SyntaxHighlighter language={language} style={docco}>
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
