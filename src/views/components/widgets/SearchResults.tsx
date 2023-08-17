import React, { useState, useEffect, useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { marked } from 'marked'
import tablemark from 'tablemark'
import { searchZotero } from '../../../models/chains/search'
import { getItemAndBestAttachment } from '../../../models/utils/zotero'
import { useDialog } from '../../hooks/useDialog'
import { ItemIcon } from '../../icons/zotero'

interface SearchResult {
  title: string
  authors?: string
  itemType: string
  year?: number
  links: Awaited<ReturnType<typeof getItemAndBestAttachment>>
}

const columnHelper = createColumnHelper<SearchResult>()

export interface SearchResultsProps extends Awaited<ReturnType<typeof searchZotero>> {}

export function SearchResults({ query: { keywords, authors = [], years }, count, results }: SearchResultsProps) {
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

  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
    }),
    columnHelper.accessor('authors', {
      header: 'Authors',
    }),
    columnHelper.accessor('itemType', {
      header: 'Item Type',
    }),
    columnHelper.accessor('year', {
      header: 'Year',
    }),
    columnHelper.accessor('links', {
      header: '',
      cell: props => {
        const { item, attachment } = props.getValue()
        return (
          <div className="whitespace-nowrap">
            <a href="#" onClick={event => openItem(event, item.id)}>
              <ItemIcon itemType={item.type} />
            </a>
            {attachment ? (
              <a href="#" onClick={event => openAttachment(event, attachment.id)}>
                <ItemIcon itemType={attachment.type} />
              </a>
            ) : null}
          </div>
        )
      },
    }),
  ]

  // Must be wrapped in useMemo or pagination won't work
  const data = useMemo(
    () =>
      results.map(({ item, attachment }) => {
        return {
          title: item.title as string,
          authors: item.authors,
          itemType: item.type,
          year: item.year,
          links: {
            item: {
              id: item.id,
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
          {authors.length > 0 ? (
            <div>
              <span className="font-bold">Authors:</span> {authors.join(', ')}
            </div>
          ) : null}
          <div>
            <span className="font-bold">Date Range:</span> {years?.from} - {years?.to}
          </div>
        </div>
      </div>
      <div>
        <h4 className="p-0 m-0 mb-1 text-tomato">
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
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
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
          <div>I couldn't find any result. Try modifying your search query or choosing another topic.</div>
        )}
      </div>
    </div>
  )
}

export function copySearchResults({ query: { keywords, authors, tags, years }, count, results }: SearchResultsProps) {
  const data = results.map(({ item, attachment }) => {
    return {
      title: item.title as string,
      authors: item.authors,
      itemType: item.type,
      year: item.year,
    }
  })
  const keywordsStr = keywords.length > 0 ? `__Keywords:__ ${keywords.join(', ')}\n\n` : ''
  const authorsStr = authors && authors.length > 0 ? `__Authors:__ ${authors.join(', ')}\n\n` : ''
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

${keywordsStr}${authorsStr}${tagsStr}${yearsStr}

#### Results (${count > 25 ? `${count}, limited to the first 25` : count})

${tablemark(data, { columns: ['Title', 'Authors', 'Item Type', 'Year'] })}
  `.trim()
  const htmlContent = marked(textContent)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}
