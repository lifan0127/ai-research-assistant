import { zodFunction } from 'openai/helpers/zod'
import { z } from 'zod'
import { conditions, operators } from './const'

// use zodFunction to convert to JSON schema
const searchTagsDef = {
  name: "search_tag",
  description: "A function to use a list of words or partial words to search for tags. Useful to refine search scope or improve accuracy.",
  parameters: z.object({
    queries: z.array(z.string()).describe("List of up to five words or partial words to search for tags")
  }),
}

const searchCreatorsDef = {
  name: "search_creator",
  description: "A function to use a list of names or partial names to search for creators (authors, editors etc.). Useful to refine search scope or improve accuracy.",
  parameters: z.object({
    queries: z.array(z.string()).describe("List of up to five names or partial names to search for authors. The names should cover different spelling variants for comprehensiveness.")
  }),
}

export const searchItemsDef = {
  name: "search_items",
  description: "A function to search for items in your Zotero library using a list of words or partial words. Useful to refine search scope or validate search results.",
  parameters: z.object({
    conditions: z.array(
      z.object({
        condition: z.enum(conditions).describe("The condition field to search within."),
        operator: z.enum(operators).describe("The operator to use for the search condition. The \"isBefore\" and \"isAfter\" operators only work with date conditions."),
        value: z.optional(z.string().describe("The value to search for in the specified field, omittable for some operators.")),
      })
    ).describe("A list of search conditions to apply."),
    match: z.enum(["all", "any"]).describe("Determines whether to match all conditions ('all', more restrictive) or any condition ('any', broader scope) based on the user aquestion."),
    // searchSubcollections: z.boolean().describe("Whether to include subcollections in the search."),
    // showOnlyTopLevelItems: z.boolean().describe("Whether to show only top-level items in the search results."),
    // includeParentAndChildItems: z.boolean().describe("Whether to include both parent and child items of matching items."),
  }),
}