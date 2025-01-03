import React, { useState, useMemo, useRef, useEffect } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import { marked } from "marked"
import tablemark from "tablemark"
import { DocumentIcon } from "@heroicons/react/24/outline"
import { getItemAndBestAttachment } from "../../../../apis/zotero/item"
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid"
import { ItemButton } from "../../../components/buttons/ItemButton"
import { createCollection } from "../../../../apis/zotero/collection"
import { ARIA_LIBRARY } from "../../../../utils/constants"
import { config } from "../../../../../package.json"
import { copyButtonDef, noteButtonDef } from "../../../components/buttons/types"
import { DEFAULT_BIB_STYLE } from "../../../../utils/constants"
import { SearchActionResponse } from "../../../../models/utils/actions"
import * as zot from "../../../../apis/zotero"
import { isEmpty, cloneDeep, set } from "lodash"
import { SearchActionControl, Query } from "../../../../typings/actions"
import { CodeHighlighter } from "../../../components/visuals/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import {
  SearchCondition,
  SearchParameters,
  nestedSearch,
} from "../../../../apis/zotero/search"
import { openAdvancedSearch } from "../../../../apis/zotero/controls/search"
import { transformPreviewResult } from "../../../../apis/zotero/item"
import { SearchStrategy } from "../../../components/visuals/SearchStrategy"
import { StructuredMessage } from "../../../../typings/steps"

const columnHelper =
  createColumnHelper<ReturnType<typeof transformPreviewResult>>()

export interface Input {
  status: "COMPLETED" | "IN_PROGRESS"
  id: string
  messageId: string
  stepId: string
}
export interface Context {
  query: Query
}

export interface Props {
  input: Input
  context: StructuredMessage["context"]
  control: SearchActionControl
}

export function Component({
  input: { messageId, stepId, id, output, ...input },
  context: { query },
  control,
}: Props) {
  console.log({ searchActionid: id, output })
  const { scrollToEnd, updateBotAction } = control
  // const [output, setOutput] =
  //   useState<Awaited<ReturnType<typeof nestedSearch>>>()
  const ref = useRef<HTMLButtonElement>(null)
  const [showSearchOutput, setShowSearchOutput] = useState(false)

  useEffect(() => {
    async function searchZotero(query: Query | undefined) {
      if (query) {
        const output = await nestedSearch(query)
        updateBotAction(messageId, stepId, id, { output })
      }
      return null
    }
    searchZotero(query as Query)
  }, [query])

  // async function openInAdvancedSearchWindow(event: React.MouseEvent) {
  //   event.preventDefault()
  //   await openAdvancedSearch(input)
  // }

  // return (
  //   <div>
  //     <div>Search Widget</div>
  //     <CodeHighlighter
  //       code={stringify(input)}
  //       language="json"
  //       className="text-sm"
  //     />
  //     <CodeHighlighter
  //       code={stringify(results)}
  //       language="json"
  //       className="text-sm"
  //     />
  //   </div>
  // )

  useEffect(() => {
    scrollToEnd()
  }, [output])

  const columns = [
    columnHelper.accessor("title", {
      header: "Title",
    }),
    columnHelper.accessor("creators", {
      header: "Creators",
    }),
    columnHelper.accessor("itemType", {
      header: "Item Type",
    }),
    columnHelper.accessor("year", {
      header: "Year",
      cell: ({ cell }) => cell.getValue() || "–",
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

  const table = useReactTable({
    data: (output?.results as any) || [],
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  function createLinks(row: Row<ReturnType<typeof transformPreviewResult>>) {
    if (!row.original || !row.original.links) {
      return null
    }
    const { item, attachment } = row.original.links
    return (
      <div className="whitespace-nowrap">
        <ItemButton item={item} mode="item" />
        {attachment ? <ItemButton item={attachment} mode="attachment" /> : null}
      </div>
    )
  }

  function renderResults(output: Awaited<ReturnType<typeof nestedSearch>>) {
    const { count, results } = output
    return (
      <div>
        {__env__ === "development" ? (
          <div>
            <DocumentIcon
              title={JSON.stringify({ input }, null, 2)}
              className="h-6 w-6 text-gray-200 absolute right-2"
              onClick={() => setShowSearchOutput(!showSearchOutput)}
            />
            {showSearchOutput ? (
              <div className="bg-slate-50 z-10 text-xs absolute right-10">
                <CodeHighlighter
                  code={stringify({ input, results })}
                  language="json"
                  className="text-sm"
                />
              </div>
            ) : null}
          </div>
        ) : null}
        <h4 className="p-0 m-0 pt-4 mb-1 text-tomato text-lg">
          Results{" "}
          <small>
            ({count > 10 ? `${count}, limited to the first 10` : count})
          </small>
        </h4>
        {results && results.length > 0 ? (
          <div>
            <table className="w-full border-collapse border-spacing-0">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-slate-200">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left py-1 whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                    <th></th>
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={i % 2 === 1 ? "bg-slate-100" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-1">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                    <td>{createLinks(row)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {table.getFooterGroups().map((footerGroup) => (
                  <tr key={footerGroup.id} className="py-1">
                    {footerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.footer,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </tfoot>
            </table>
            {/* <div className="w-full my-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-50">
                <span className="flex items-center gap-1">
                  {count > 1 ? `View all ${count} results or m` : "M"}odify
                  search using Advanced Search
                </span>
                <div className="flex-grow"></div>
                <a
                  href="#"
                  className="px-6 py-1 bg-tomato text-white font-bold no-underline rounded-md"
                  onClick={openInAdvancedSearchWindow}
                >
                  Open
                </a>
              </div>
            </div> */}
            {/* <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <div className="flex-grow"></div>
              <button
                className="px-0 py-0 mr-1"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {"<"}
              </button>
              <button
                className="px-0 py-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {">"}
              </button>
            </div> */}
          </div>
        ) : (
          <div>
            I couldn't find any result. If this is not what you have
            anticipated, please try modifying your search query or choosing
            another topic.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="text-base">
      <div className="mb-2">
        <h4 className="p-0 m-0 mb-1 text-tomato text-lg">Search Strategy</h4>
        {query ? <SearchStrategy query={query} /> : null}
        {/* <div>
          {qtexts.length > 0 ? (
            <div>
              <span className="font-bold">Query Text:</span>{" "}
              {qtexts.map((qtext, i) => (
                <>
                  <span className="bg-orange-100 rounded-md px-2 pb-1">
                    {qtext}
                  </span>
                  {i < qtexts.length - 1 ? " OR " : null}
                </>
              ))}
            </div>
          ) : null}
          {creators.length > 0 ? (
            <div>
              <span className="font-bold">Creators:</span> {creators.join(", ")}
            </div>
          ) : null}
          {tags.length > 0 ? (
            <div>
              <span className="font-bold">Tags:</span> {tags.join(", ")}
            </div>
          ) : null}
          <div>
            <span className="font-bold">Date Range:</span> {years?.from} -{" "}
            {years?.to}
          </div>
        </div> */}
      </div>
      {output ? renderResults(output) : null}
    </div>
  )
}

export function compileContent({
  query: { qtexts = [], creators, tags, years },
  count,
  results,
}: any) {
  const data = results.map(({ item, attachment }: any, i: number) => {
    const columns = {
      title: item.title as string,
      creators: item.creators,
      itemType: item.type,
      year: item.year,
    }
    return columns
  })
  const qtextsStr =
    qtexts.length > 0
      ? `__Query Text:__ ${qtexts.map((qtext: string) => `(${qtext})`).join(" OR ")}\n\n`
      : ""
  const creatorsStr =
    creators && creators.length > 0
      ? `__Creators:__ ${creators.join(", ")}\n\n`
      : ""
  const tagsStr =
    tags && tags.length > 0 ? `__Tags:__ ${tags.join(", ")}\n\n` : ""
  const yearsStr = years
    ? years.from
      ? years.to
        ? `__Date Range:__ ${years.from} - ${years.to}\n\n`
        : `__Date Range:__ From ${years.from}\n\n`
      : `__Date Range:__ To ${years.to}\n\n`
    : ""
  const textContent = `
#### Search Strategy

${qtextsStr}${creatorsStr}${tagsStr}${yearsStr}

#### Results (${count > 25 ? `${count}, limited to the first 25` : count})

${tablemark(data, { columns: ["Title", "Creators", "Item Type", "Year"] })}
  `.trim()
  const htmlContent = marked(textContent)
  return { textContent, htmlContent }
}

function copy(props: Props) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard()
    .addText(textContent, "text/unicode")
    .addText(htmlContent, "text/html")
    .copy()
}

async function createNote({
  query: { qtexts = [], creators, tags, years },
  count,
  results,
}: any) {
  const resultIds: string[] = results.map(({ item }: any) => item.id)
  const csl = Zotero.Styles.get(DEFAULT_BIB_STYLE).getCiteProc()
  csl.updateItems(resultIds)
  const bibs = csl.makeBibliography()[1]
  const resultItems = await Zotero.Items.getAsync(resultIds)
  const citations = resultItems.map((item: any) => ({
    uris: [Zotero.URI.getItemURI(item)],
    itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
  }))
  const qtextsStr =
    qtexts.length > 0
      ? `<div><strong>Query Text:</strong> ${qtexts.map((qtext: string) => `(${qtext})`).join(" OR ")}</div>`
      : ""
  const creatorsStr =
    creators && creators.length > 0
      ? `<div><strong>Creators:</strong> ${creators.join(", ")}</div>`
      : ""
  const tagsStr =
    tags && tags.length > 0
      ? `<div><strong>Tags:</strong> ${tags.join(", ")}</div>`
      : ""
  const yearsStr = years
    ? years.from
      ? years.to
        ? `<div><strong>Date Range:</strong> ${years.from} - ${years.to}</div>`
        : `<div><strong>Date Range:</strong> From ${years.from}</div>`
      : `<div><strong>Date Range:</strong> To ${years.to}</div>`
    : ""
  const content = `
<h2>Search Strategy</h2>

${qtextsStr}${creatorsStr}${tagsStr}${yearsStr}

<h2>Results (${count > 25 ? `${count}, limited to the first 25` : count})</h2>

<ol>
${resultItems
  .map((item, i) => {
    const citation = {
      uris: [Zotero.URI.getItemURI(item)],
      itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
    }
    const citationPreview = Zotero.EditorInstanceUtilities.formatCitation({
      citationItems: [citation],
    })
    const citationData = {
      citationItems: [{ uris: citation.uris }],
      properties: {},
    }
    const citationKey = `<span class="citation" data-citation="${encodeURIComponent(
      JSON.stringify(citationData),
    )}">(<span class="citation-item">${citationPreview}</span>)</span>`
    return `<li>${citationKey} ${bibs[i].replace(/\(\d+\)\s+/, "")}</li>`
  })
  .join("\n")}
</ol>
  `.trim()

  const note =
    `<div data-schema-version="8" data-citation-items="${encodeURIComponent(JSON.stringify(citations))}">` +
    `<h1>New Search Results from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
    content +
    "</div>"
  return note
}

export const buttonDefs = [
  {
    name: "COPY",
    utils: { copy },
  } as copyButtonDef,
  {
    name: "NOTE",
    utils: { createNote },
  } as noteButtonDef,
]
