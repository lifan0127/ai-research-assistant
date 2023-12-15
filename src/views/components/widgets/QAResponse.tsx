import React from 'react'
import * as Markdown from './Markdown'
import { marked } from 'marked'
import { createCitations } from '../../../apis/zotero/citation'
import { ItemButton } from '../item/ItemButton'
import { createCollection } from '../../../apis/zotero/collection'
import { ARIA_LIBRARY } from '../../../constants'

export interface Props {
  answer: string
  sources: Awaited<ReturnType<typeof createCitations>>
}

export function Component({ answer, sources }: Props) {
  return (
    <div>
      <Markdown.Component content={answer} />
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

function compileContent({ answer, sources = [] }: Props) {
  const textContent =
    sources.length === 0
      ? answer
      : `
${answer}

#### References

${sources.map(({ bib }) => bib).join('\n')}
  `.trim()
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
      `<h1>New Q&A Response from Aria - ${new Date().toLocaleString()}</h1>` +
      marked(htmlContent) +
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
