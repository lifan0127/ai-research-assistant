import React from 'react'
import MarkdownReact from 'marked-react'
import { marked } from 'marked'
import { createCitations } from '../../../apis/zotero/citation'
import { ItemButton } from '../item/ItemButton'

export interface QAResponseProps {
  answer: string
  sources: Awaited<ReturnType<typeof createCitations>>
}

export function QAResponse({ answer, sources }: QAResponseProps) {
  return (
    <div>
      <MarkdownReact>{answer}</MarkdownReact>
      {sources.length > 0 ? (
        <div className="text-sm">
          <h4 className="p-0 m-0 !mt-4 mb-1 text-tomato">References</h4>
          <ol className="list-none p-0">
            {sources.map(({ item, attachment, bib }) => {
              return (
                <li key={item.id} className="mb-2 last:mb-0">
                  {bib}
                  <ItemButton item={item} mode="item" />
                  {attachment ? <ItemButton item={attachment} mode="attachment" /> : null}
                </li>
              )
            })}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

export function copyQAResponse({ answer, sources = [] }: QAResponseProps) {
  const textContent =
    sources.length === 0
      ? answer
      : `
${answer}

#### References

${sources.map(({ bib }) => bib).join('\n')}
  `.trim()
  const htmlContent = marked(textContent)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}
