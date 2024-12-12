import { title } from "process"
import * as zot from "../apis/zotero"
import { suggestTags, suggestCreators } from "../apis/zotero/suggest"
import { countBy, orderBy } from "lodash"
import stringify from "json-stringify-pretty-compact"
import { search } from "../apis/zotero/search"

export const tools = {
  search_tag: {
    title: "Search Tags",
    description: "Searched tags in your Zotero library using the following queries:"
  },
  search_creator: {
    title: "Search Creators",
    description: "Searched creators (authors, editors etc.) in your Zotero library using the following queries:"
  },
  search_item: {
    title: "Search Items",
    description: "Searched items in your Zotero library using the following conditions:"
  }
}

export async function runFunctionTool(tool: string, toolArguments: any) {
  if (tool.startsWith("search_")) {
    const fieldName = tool.slice(7) as zot.FieldName | "item"
    if (fieldName === "item") {
      const searchParams = toolArguments
      return stringify(await search(searchParams, 10, "search"))
    } else {
      const { queries } = toolArguments
      let results: string[][] = []
      if (fieldName === "tag") {
        results = await Promise.all(queries.map((query: string) => suggestTags({ qtext: query })))
      } else if (fieldName === "creator") {
        results = await Promise.all(queries.map((query: string) => suggestCreators({ qtext: query })))
      } else {
        const { queries } = toolArguments
        for (const query of queries) {
          const result = await zot.suggest(query, fieldName) as string[]
          console.log({ query, result })
          results.push(result)
        }
      }
      const allResults = results.flat()
      const frequencyMap = countBy(allResults)
      const sortedResults = orderBy(
        Object.keys(frequencyMap),
        (key) => frequencyMap[key],
        "desc",
      )
      return sortedResults.slice(0, 10).join("; ")
    }
  }

  return ""
}