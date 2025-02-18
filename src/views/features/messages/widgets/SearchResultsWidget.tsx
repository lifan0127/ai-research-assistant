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
  SearchActionStepControl,
  QueryType,
  ActionStatus,
} from "../../../../typings/actions"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import {
  SearchCondition,
  SearchParameters,
  recursiveSearchAndCompileResults,
} from "../../../../apis/zotero/search"
import { openAdvancedSearch } from "../../../../apis/zotero/controls/search"
import { transformPreviewResult } from "../../../../apis/zotero/item"
import { SearchStrategy } from "../../../components/search/SearchStrategy"
import { RoutingOutput } from "../../../../models/schemas/routing"
import { SearchResultTable } from "../../../components/search/SearchResultTable"
import { action as log } from "../../../../utils/loggers"
import { SearchActionStepContent } from "../../../../typings/steps"
import { MessageStepControl } from "../../../../typings/steps"

const columnHelper =
  createColumnHelper<ReturnType<typeof transformPreviewResult>>()

export interface SearchWidgetContent {
  id: string
  messageId: string
  status: ActionStatus
  params: {
    widget: "search"
    message: {
      query: QueryType
      searchResultsStepId: string
    }
  }
}
export interface Context {
  query: QueryType
}

export interface SearchResultsWidgetProps {
  content: SearchWidgetContent
  control: MessageStepControl
}

export function SearchResultsWidget({
  content: {
    messageId,
    id,
    params: {
      message: { query, searchResultsStepId },
    },
    status,
  },
  control: { getBotStep, scrollToEnd, updateBotAction },
}: SearchResultsWidgetProps) {
  const searchResultsBotStep = getBotStep(
    messageId,
    searchResultsStepId,
  ) as SearchActionStepContent
  const output = searchResultsBotStep.params.action.output
  log({ output })

  return (
    <div className="text-base">
      <div className="mb-2">
        <h4 className="p-0 m-0 mb-1 text-tomato text-lg">Search Strategy</h4>
        {query ? <SearchStrategy query={query} /> : null}
      </div>
      <div>
        <h4 className="p-0 m-0 pt-4 mb-1 text-tomato text-lg">
          Results{" "}
          <small>
            (
            {output.count > 25
              ? `${output.count}, limited to the first 25`
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

function copy(props: SearchResultsWidgetProps) {
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
