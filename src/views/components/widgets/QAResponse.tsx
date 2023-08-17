import React from 'react'
import MarkdownReact from 'marked-react'
import { marked } from 'marked'
import { createCitations } from '../../../models/chains/qa'
import { useDialog } from '../../hooks/useDialog'
import { ItemIcon } from '../../icons/zotero'

export interface QAResponseProps {
  answer: string
  sources: Awaited<ReturnType<typeof createCitations>>
}

export function QAResponse({ answer, sources }: QAResponseProps) {
  const dialog = useDialog()

  function openItem(event: React.MouseEvent<HTMLElement>, itemId: number) {
    event.preventDefault()
    dialog.mode === 'NORMAL' && dialog.minimize()
    ZoteroPane.selectItem(itemId)
  }

  function openAttachment(event: React.MouseEvent<HTMLElement>, attachmentId: number) {
    event.preventDefault()
    dialog.mode === 'NORMAL' && dialog.minimize()
    ZoteroPane.viewAttachment(attachmentId)
  }

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
                  <a href="#" onClick={event => openItem(event, item.id)}>
                    <ItemIcon itemType={item.type} />
                  </a>
                  {attachment ? (
                    <a href="#" onClick={event => openAttachment(event, attachment.id)}>
                      <ItemIcon itemType={attachment.type} />
                    </a>
                  ) : null}
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
