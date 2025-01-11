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
import {
  SearchActionControl,
  Query,
  ActionStatus,
} from "../../../../typings/actions"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import {
  SearchCondition,
  SearchParameters,
  nestedSearch,
} from "../../../../apis/zotero/search"
import { openAdvancedSearch } from "../../../../apis/zotero/controls/search"
import { transformPreviewResult } from "../../../../apis/zotero/item"
import { SearchStrategy } from "../../../components/search/SearchStrategy"
import { RoutingOutput } from "../../../../models/schemas/routing"
import { SearchResultTable } from "../../../components/search/SearchResultTable"
import { action as log } from "../../../../utils/loggers"

const columnHelper =
  createColumnHelper<ReturnType<typeof transformPreviewResult>>()

export interface Content {
  status: ActionStatus
  id: string
  messageId: string
  stepId: string
  output: any
}
export interface Context {
  query: Query
}

export interface Props {
  content: Content
  context: RoutingOutput["context"]
  control: SearchActionControl
}

export function Component({
  content: { messageId, stepId, id, output, status },
  context: { query },
  control: { scrollToEnd, updateBotAction },
}: Props) {
  log("Render search action", { status, output })
  useEffect(() => {
    async function searchZotero(query: Query | undefined) {
      if (query) {
        const results = await nestedSearch(query, "preview")
        log("Search Zotero", { query, results })
        updateBotAction(messageId, stepId, id, {
          output: results,
          status: "COMPLETED",
        })
      }
    }
    if (!output) {
      searchZotero(query as Query)
    }
  }, [query])

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

  return (
    <div className="text-base">
      <div className="mb-2">
        <h4 className="p-0 m-0 mb-1 text-tomato text-lg">Search Strategy</h4>
        {query ? <SearchStrategy query={query} /> : null}
      </div>
      {output ? (
        <div>
          <h4 className="p-0 m-0 pt-4 mb-1 text-tomato text-lg">
            Results{" "}
            <small>
              (
              {output.count > 10
                ? `${output.count}, limited to the first 10`
                : output.count}
              )
            </small>
          </h4>
          {output.results && output.results.length > 0 ? (
            <SearchResultTable count={output.count} results={output.results} />
          ) : (
            <div>
              I couldn't find any result. If this is not what you have
              anticipated, please try modifying your search query or choosing
              another topic.
            </div>
          )}
        </div>
      ) : (
        <div className="p-[15px]">
          <div className="dot-flashing "></div>
        </div>
      )}
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
