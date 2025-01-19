import { uniq, cloneDeep, flatten } from "lodash"
import { getItemAndBestAttachment } from "./item"
import retry, { Options } from "async-retry"
import { compileItemInfo, ItemInfo, getItemsAndBestAttachments } from "./item"
import { ItemMode } from "./item"
import { Query } from "../../typings/actions"

export interface SearchCondition {
  condition: Zotero.Search.Conditions
  operator: Zotero.Search.Operator
  value?: string
}

export interface SearchParameters {
  conditions: SearchCondition[]
  match: "any" | "all"
  title: string
  // searchSubcollections: boolean
  // showOnlyTopLevelItems: boolean
  // includeParentAndChildItems: boolean
}

export function createSearchInstance({
  conditions = [],
  match = "all" as const,
  // searchSubcollections = false,
  // showOnlyTopLevelItems = false,
  // includeParentAndChildItems = false,
}: SearchParameters): Zotero.Search {
  const search = new Zotero.Search()

  // Set the join mode based on the 'match' parameter
  search.addCondition("joinMode", match)

  // Add each search condition
  for (const { condition, operator, value } of conditions) {
    search.addCondition(condition, operator, value)
  }

  // Search top-level items only
  search.addCondition("noChildren", "true")

  // // Set additional search options
  // if (searchSubcollections) {
  //   search.addCondition('recursive', 'true')
  // }

  // if (showOnlyTopLevelItems) {
  //   search.addCondition('noChildren', 'true')
  // }

  // if (includeParentAndChildItems) {
  //   search.addCondition('includeParentsAndChildren', 'true')
  // }

  return search
}

export async function search(
  searchParams: SearchParameters,
  limit: number = 10,
  mode: ItemMode = "preview",
) {
  const search = createSearchInstance(searchParams)

  const itemIds = await search.search()

  if (itemIds.length === 0) {
    return { count: 0, results: [] }
  }

  const results = await getItemsAndBestAttachments(
    limit ? itemIds.slice(0, limit) : itemIds,
    mode,
  )

  return { count: itemIds.length, results }
}

// export type NestedQuery = {
//   boolean: "AND" | "OR"
//   subqueries: (NestedQuery | SearchParameters)[]
// }

// export type Query = NestedQuery | SearchParameters

// Function to recursively execute searches and combine results
export async function recursiveSearch(query: Query): Promise<number[]> {
  if ("conditions" in query) {
    const search = createSearchInstance(query)
    return await search.search()
  }

  const { boolean, subqueries } = query

  // Results of all subqueries
  const results = await Promise.all(
    subqueries.map(async (subquery) => {
      if ("conditions" in subquery!) {
        const search = createSearchInstance(subquery)
        return search.search()
      } else if (subquery!.subqueries) {
        // Nested subquery
        return recursiveSearch(subquery!)
      } else {
        throw new Error("Invalid query structure.")
      }
    }),
  )

  // Combine results based on the boolean operator
  if (boolean === "AND") {
    // Intersection of results
    return results.reduce(
      (acc: number[], result: number[]) =>
        acc.filter((id: number) => result.includes(id)),
      results[0] || [],
    )
  } else if (boolean === "OR") {
    // Union of results
    return uniq(results.flat())
  } else {
    throw new Error(`Unsupported boolean operator: ${boolean}`)
  }
}

export async function recursiveSearchAndCompileResults(query: Query, mode: ItemMode) {
  const itemIds: number[] = await recursiveSearch(query)
  const results = await getItemsAndBestAttachments(itemIds, mode)

  return { count: itemIds.length, results }
}
