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
  ActionType,
} from "../../../../typings/actions"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import {
  SearchCondition,
  SearchParameters,
  recursiveSearchAndCompileResults,
  recursiveSearch,
} from "../../../../apis/zotero/search"
import { getItemsAndIndexAttachments } from "../../../../apis/zotero/item"
import { openAdvancedSearch } from "../../../../apis/zotero/controls/search"
import { transformPreviewResult } from "../../../../apis/zotero/item"
import { SearchStrategy } from "../../../components/search/SearchStrategy"
import { RoutingOutput } from "../../../../models/schemas/routing"
import { SearchResultTable } from "../../../components/search/SearchResultTable"
import { action as log } from "../../../../utils/loggers"
import { ZoteroIcon } from "../../../icons/zotero"
import { CSSTransition } from "react-transition-group"
import { SearchActionStepContent } from "../../../../typings/steps"
import { useAssistant } from "../../../../hooks/useAssistant"

const columnHelper =
  createColumnHelper<ReturnType<typeof transformPreviewResult>>()

export interface SearchActionProps {
  content: SearchActionStepContent
  control: SearchActionStepControl
}

export function SearchAction({
  content: { messageId, id, status, params },
  control: { scrollToEnd, pauseScroll, getBotStep, updateBotStep },
}: SearchActionProps) {
  const {
    action: { mode, output },
    workflow,
  } = params
  const { query } = getBotStep(workflow.messageId, workflow.stepId)!.params
    .context
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  log("Render search action", { status, output, params })
  useEffect(() => {
    async function searchZotero(query: QueryType | undefined) {
      if (query) {
        let output
        switch (mode) {
          case "search": {
            output = await recursiveSearchAndCompileResults(query, "preview")
            break
          }
          case "qa": {
            output = await recursiveSearchAndCompileResults(query, "qa")
            break
          }
          case "fulltext": {
            const itemIds = await recursiveSearch(query)
            // const results = await getItemsAndIndexAttachments(
            //   itemIds,
            //   assistant.currentVectorStore!,
            // )
            output = {
              count: Math.min(itemIds.length, 10),
              results: itemIds.slice(0, 10),
            }
            break
          }
        }
        updateBotStep(messageId, id, {
          status: "COMPLETED",
          params: {
            ...params,
            action: { ...params.action, output },
          },
        })
        updateBotStep(messageId, params.workflow.stepId, {
          type: "WORKFLOW_STEP",
          params: {
            searchResultsStepId: id,
            searchResultsCount: output.count,
          },
        })
      }
    }
    if (output === undefined) {
      searchZotero(query as QueryType)
    }
  }, [query])

  useEffect(() => {
    scrollToEnd()
  }, [output])

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    setExpanded(!expanded)
    pauseScroll()
  }

  return (
    <div style={{ width: "fit-content" }} className="py-2">
      <span className="mr-2">
        <ZoteroIcon isLoading={status === "IN_PROGRESS"} />
      </span>
      <a
        href="#"
        onClick={handleClick}
        className="border-none bg-transparent m-0 p-0 text-black align-middle text-lg"
        style={{ textDecorationLine: "none" }}
      >
        Taking action <span className="font-bold">Search Zotero Library</span>
        {status === "COMPLETED" ? (
          expanded ? (
            <ChevronUpIcon className="h-6 w-6 align-middle" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 align-middle" />
          )
        ) : null}
      </a>
      <CSSTransition
        nodeRef={ref}
        in={expanded}
        timeout={300}
        classNames="collapsible-panel"
        unmountOnExit
      >
        <div
          ref={ref}
          className="px-6 py-4 rounded-md bg-white text-base my-1 sm:max-w-[85%]"
        >
          <div>Searched items in your Zotero library</div>
          <div className="max-h-60 overflow-auto">
            <CodeHighlighter
              code={stringify(query)}
              language="json"
              className="text-sm"
            />
          </div>
          {status === "COMPLETED" ? (
            output ? (
              <div>
                Found {output.count} {output.count > 1 ? "items." : "item."}
              </div>
            ) : (
              <div>No items found</div>
            )
          ) : (
            <div>Waiting for response...</div>
          )}
        </div>
      </CSSTransition>
    </div>
  )
}
