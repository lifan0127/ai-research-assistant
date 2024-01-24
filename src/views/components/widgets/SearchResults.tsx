import React, { useMemo, useRef } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table'
import { marked } from 'marked'
import tablemark from 'tablemark'
import { searchZotero } from '../../../models/chains/search'
import { getItemAndBestAttachment } from '../../../apis/zotero/item'
import { ItemButton } from '../item/ItemButton'
import { createCollection } from '../../../apis/zotero/collection'
import { ARIA_LIBRARY } from '../../../constants'
import { config } from '../../../../package.json'
import { copyButtonDef, noteButtonDef } from '../buttons/types'
import { DEFAULT_BIB_STYLE } from '../../../constants'

interface SearchResult {
  title: string
  creators?: string
  itemType: string
  year?: number
  links: Awaited<ReturnType<typeof getItemAndBestAttachment>>
}

const columnHelper = createColumnHelper<SearchResult>()

export interface Props extends Awaited<ReturnType<typeof searchZotero>> {}

export function Component({
  query: { keywords = [], creators = [], tags = [], years },
  count,
  results,
  collections,
}: Props) {
  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
    }),
    columnHelper.accessor('creators', {
      header: 'Creators',
    }),
    columnHelper.accessor('itemType', {
      header: 'Item Type',
    }),
    columnHelper.accessor('year', {
      header: 'Year',
    }),
    // Note: The following doesn't work as useRef becomes null in ItemButtons
    // columnHelper.accessor('links', {
    //   header: '',
    //   cell: props => {
    //     const { item, attachment } = props.getValue()
    //     const ref = useRef<HTMLButtonElement>(null)
    //     return (
    //       <div className="whitespace-nowrap">
    //         <button ref={ref} onClick={() => console.log({ ref })}>
    //           Test
    //         </button>
    //         <ItemButton item={item} mode="item" />
    //         {attachment ? <ItemButton item={attachment} mode="attachment" /> : null}
    //       </div>
    //     )
    //   },
    // }),
  ]

  // Must be wrapped in useMemo or pagination won't work
  const data = useMemo(
    () =>
      results.map(({ item, attachment }) => {
        return {
          title: item.title as string,
          creators: item.creators,
          itemType: item.type,
          year: item.year,
          links: {
            item: {
              id: item.id,
              uri: item.uri,
              type: item.type,
            },
            attachment: attachment
              ? {
                  id: attachment.id,
                  type: attachment.type,
                }
              : undefined,
          },
        }
      }),
    [results]
  )

  const table = useReactTable({
    data: data,
    columns,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  function createLinks(row: Row<SearchResult>) {
    const { item, attachment } = row.original.links
    const ref = useRef<HTMLButtonElement>(null)
    return (
      <div className="whitespace-nowrap">
        <ItemButton item={item} mode="item" />
        {attachment ? <ItemButton item={attachment} mode="attachment" /> : null}
      </div>
    )
  }

  return (
    <div className="text-sm">
      <div className="mb-2">
        <h4 className="p-0 m-0 mb-1 text-tomato">Search Strategy</h4>
        <div>
          {keywords.length > 0 ? (
            <div>
              <span className="font-bold">Keywords:</span> {keywords.join(', ')}
            </div>
          ) : null}
          {creators.length > 0 ? (
            <div>
              <span className="font-bold">Creators:</span> {creators.join(', ')}
            </div>
          ) : null}
          {tags.length > 0 ? (
            <div>
              <span className="font-bold">Tags:</span> {tags.join(', ')}
            </div>
          ) : null}
          {collections.length > 0 ? (
            <div>
              <span className="font-bold">Collections:</span> {collections.map(col => col.name).join(', ')}
            </div>
          ) : null}
          <div>
            <span className="font-bold">Date Range:</span> {years?.from} - {years?.to}
          </div>
        </div>
      </div>
      <div>
        <h4 className="p-0 m-0 pt-4 mb-1 text-tomato">
          Results <small>({count > 25 ? `${count}, limited to the first 25` : count})</small>
        </h4>
        {data.length > 0 ? (
          <div>
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="text-left">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                    <th></th>
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                    <td>{createLinks(row)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {table.getFooterGroups().map(footerGroup => (
                  <tr key={footerGroup.id}>
                    {footerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </tfoot>
            </table>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <div className="flex-grow"></div>
              <button
                className="px-0 py-0 mr-1"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {'<'}
              </button>
              <button className="px-0 py-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                {'>'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            I couldn't find any result. If this is not what you have anticipated, please try modifying your search query
            or choosing another topic.
          </div>
        )}
      </div>
    </div>
  )
}

export function compileContent({ query: { keywords = [], creators, tags, years }, count, results }: Props) {
  const data = results.map(({ item, attachment }, i) => {
    const columns = {
      title: item.title as string,
      creators: item.creators,
      itemType: item.type,
      year: item.year,
    }
    return columns
  })
  const keywordsStr = keywords.length > 0 ? `__Keywords:__ ${keywords.join(', ')}\n\n` : ''
  const creatorsStr = creators && creators.length > 0 ? `__Creators:__ ${creators.join(', ')}\n\n` : ''
  const tagsStr = tags && tags.length > 0 ? `__Tags:__ ${tags.join(', ')}\n\n` : ''
  const yearsStr = years
    ? years.from
      ? years.to
        ? `__Date Range:__ ${years.from} - ${years.to}\n\n`
        : `__Date Range:__ From ${years.from}\n\n`
      : `__Date Range:__ To ${years.to}\n\n`
    : ''
  const textContent = `
#### Search Strategy

${keywordsStr}${creatorsStr}${tagsStr}${yearsStr}

#### Results (${count > 25 ? `${count}, limited to the first 25` : count})

${tablemark(data, { columns: ['Title', 'Creators', 'Item Type', 'Year'] })}
  `.trim()
  const htmlContent = marked(textContent)
  return { textContent, htmlContent }
}

function copy(props: Props) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}

async function createNote({ query: { keywords = [], creators, tags, years }, count, results }: Props) {
  const resultIds = results.map(({ item }) => item.id)
  const csl = Zotero.Styles.get(DEFAULT_BIB_STYLE).getCiteProc()
  csl.updateItems(resultIds)
  const bibs = csl.makeBibliography()[1]
  const resultItems = await Zotero.Items.getAsync(resultIds)
  const citations = resultItems.map(item => ({
    uris: [Zotero.URI.getItemURI(item)],
    itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
  }))
  const keywordsStr = keywords.length > 0 ? `<div><strong>Keywords:</strong> ${keywords.join(', ')}</div>` : ''
  const creatorsStr =
    creators && creators.length > 0 ? `<div><strong>Creators:</strong> ${creators.join(', ')}</div>` : ''
  const tagsStr = tags && tags.length > 0 ? `<div><strong>Tags:</strong> ${tags.join(', ')}</div>` : ''
  const yearsStr = years
    ? years.from
      ? years.to
        ? `<div><strong>Date Range:</strong> ${years.from} - ${years.to}</div>`
        : `<div><strong>Date Range:</strong> From ${years.from}</div>`
      : `<div><strong>Date Range:</strong> To ${years.to}</div>`
    : ''
  const content = `
<h2>Search Strategy</h2>

${keywordsStr}${creatorsStr}${tagsStr}${yearsStr}

<h2>Results (${count > 25 ? `${count}, limited to the first 25` : count})</h2>

<ol>
${resultItems
  .map((item, i) => {
    const citation = {
      uris: [Zotero.URI.getItemURI(item)],
      itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
    }
    const citationPreview = Zotero.EditorInstanceUtilities.formatCitation({ citationItems: [citation] })
    const citationData = {
      citationItems: [{ uris: citation.uris }],
      properties: {},
    }
    const citationKey = `<span class="citation" data-citation="${encodeURIComponent(
      JSON.stringify(citationData)
    )}">(<span class="citation-item">${citationPreview}</span>)</span>`
    return `<li>${citationKey} ${bibs[i].replace(/\(\d+\)\s+/, '')}</li>`
  })
  .join('\n')}
</ol>
  `.trim()

  const note =
    `<div data-schema-version="8" data-citation-items="${encodeURIComponent(JSON.stringify(citations))}">` +
    `<h1>New Search Results from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
    content +
    '</div>'
  return note
}

export const buttonDefs = [
  {
    name: 'COPY',
    utils: { copy },
  } as copyButtonDef,
  {
    name: 'NOTE',
    utils: { createNote },
  } as noteButtonDef,
]
