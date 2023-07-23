import React from 'react'
import MarkdownReact from 'marked-react'
import { createCitations } from '../../../models/chains/qa'

export interface QAResponseProps {
  answer: string
  sources: ReturnType<typeof createCitations>
}

export function QAResponse({ answer, sources }: QAResponseProps) {
  function handleReferenceClick(event: React.MouseEvent<HTMLElement>, itemId: number) {
    event.preventDefault()
    ZoteroPane.selectItem(itemId)
  }

  return (
    <div>
      <MarkdownReact>{answer}</MarkdownReact>
      {sources.length > 0 ? (
        <div className="text-sm">
          <h4 className="p-0 m-0 mb-1 text-tomato">References</h4>
          <ol className="list-none p-0">
            {sources.map(({ itemId, bib }) => {
              return (
                <li key={itemId} className="mb-2 last:mb-0">
                  <a href="#" onClick={event => handleReferenceClick(event, itemId)} className="hover:text-tomato">
                    {bib}
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
