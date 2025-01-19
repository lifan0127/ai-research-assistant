import React, { useMemo, useState, useRef } from "react"
import { CSSTransition } from "react-transition-group"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { SearchParameters } from "../../../apis/zotero/search"
import { openAdvancedSearch } from "../../../apis/zotero/controls/search"
import { Query } from "../../../typings/actions"

interface SearchParametersBlockProps {
  query: SearchParameters
}

function SearchParametersBlock({ query }: SearchParametersBlockProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { conditions, match, title } = query
  const sortedConditions = useMemo(() => {
    return conditions.sort((a, b) => {
      if (a.condition < b.condition) return -1
      if (a.condition > b.condition) return 1
      if (a.operator < b.operator) return -1
      if (a.operator > b.operator) return 1
      if (!a.value) return -1
      if (!b.value) return 1
      if (a.value < b.value) return -1
      if (a.value > b.value) return 1
      return 0
    })
  }, [conditions])

  function handleOpen(event: React.MouseEvent) {
    event.preventDefault()
    setOpen(!open)
  }

  function openAdvancedSearchWindow(event: React.MouseEvent) {
    event.preventDefault()
    openAdvancedSearch(query)
  }

  return (
    <div>
      <div>
        <a
          href="#"
          onClick={handleOpen}
          title="Search conditions"
          className="no-underline text-black"
        >
          <span
            className={
              (open ? "rounded-t-lg" : "rounded-lg") +
              " bg-blue-200 w-fit px-2 py-1 inline-block"
            }
          >
            {title}
          </span>
        </a>
      </div>
      <CSSTransition
        nodeRef={ref}
        in={open}
        timeout={300}
        classNames="collapsible-panel"
        unmountOnExit
      >
        <div ref={ref} className="bg-blue-50 p-2">
          <div className="overflow-hidden">
            <div className="w-full relative">
              <a
                href="#"
                onClick={openAdvancedSearchWindow}
                className="no-underline absolute top-0 right-0"
              >
                <MagnifyingGlassIcon className="w-5 h-5 pr-1 xs:pr-0" />
                <span className="text-sm align-top hidden sm:inline-block">
                  Open in Advanced Search
                </span>
              </a>
            </div>
            <div className="text-base">
              Match{" "}
              <span className="font-bold">
                {match === "all" ? "all" : "any"}
              </span>{" "}
              of the following conditions:
            </div>
            <ul className="list-none pl-0 grid grid-cols-1 sm:grid-cols-3 m-0">
              {sortedConditions.map((condition, index) => (
                <li key={index}>
                  <strong className="capitalize">{condition.condition}</strong>{" "}
                  {condition.operator} <em>{condition.value}</em>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CSSTransition>
    </div>
  )
}

export interface SearchStrategyProps {
  query: Query
  internal?: boolean
}

export function SearchStrategy({ query, internal }: SearchStrategyProps) {
  if ("conditions" in query) {
    return <SearchParametersBlock query={query} />
  } else if ("subqueries" in query) {
    const { boolean, subqueries } = query
    return (
      <div
        className={`${internal ? "border-2 border-solid border-gray-200 rounded-xl px-4 " : ""} py-2`}
      >
        {subqueries.map((subquery, i) => {
          return (
            <>
              <SearchStrategy
                key={i}
                query={subquery as Query}
                internal={true}
              />
              {i < subqueries.length - 1 ? (
                boolean === "AND" ? (
                  <div className="text-green-600 font-semibold my-2">
                    {boolean}
                  </div>
                ) : (
                  <div className="text-tomato font-semibold my-2">
                    {boolean}
                  </div>
                )
              ) : null}
            </>
          )
        })}
      </div>
    )
  } else {
    throw new Error("Invalid query structure.")
  }
}
