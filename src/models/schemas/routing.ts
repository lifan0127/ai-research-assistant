import { z } from "zod"
import { zodResponseFormat } from "openai/helpers/zod"
import { searchItemsDef } from "./search"
import { conditions, operators } from "./const"

type Condition = {
  condition: (typeof conditions)[number]
  operator: (typeof operators)[number]
  value: string
}
type ConditionsGroup = {
  conditions: Condition[]
  match: "all" | "any"
  title: string
}
type Subquery = {
  boolean: "AND" | "OR"
  subqueries: (Subquery | ConditionsGroup)[]
}

const ConditionSchema = z.object({
  condition: z
    .enum(conditions)
    .describe("The field to apply the condition on."),
  operator: z
    .enum(operators)
    .describe(
      "The operator to apply in the condition. Note that operators apply to whole phrases, not individual words.",
    ),
  value: z.string().describe("The value to compare against."),
})

type Query =
  | {
      conditions: Array<z.infer<typeof ConditionSchema>>
      match: "all" | "any"
      title: string
    }
  | {
      boolean: "AND" | "OR"
      subqueries: Query[]
    }
  | null

const QuerySchema: z.ZodType<Query> = z
  .union([
    z
      .object({
        conditions: z
          .array(ConditionSchema)
          .describe("List of search conditions to apply."),
        match: z
          .enum(["all", "any"])
          .describe("Determines if all or any conditions must be met."),
        title: z.string().describe("The title of the group of conditions."),
      })
      .strict()
      .describe("A simple query object."),
    z
      .object({
        boolean: z
          .enum(["AND", "OR"])
          .describe("Logical operator to combine subqueries."),
        subqueries: z
          .array(z.lazy(() => QuerySchema))
          .describe("List of subqueries or conditions to be combined."),
      })
      .strict()
      .describe("A compound query object."),
  ])
  .describe("Zotero search query to be used in search and qa actions.")
  .nullable()

export const SearchActionSchema = z
  .object({
    widget: z
      .literal("search")
      .describe(
        "Action for retrieving a list of items from the Zotero library.",
      ),
  })
  .strict()

export const QAActionSchema = z
  .object({
    widget: z
      .literal("qa")
      .describe(
        "Use this action to answer specific questions that involves retrieving and synthesizing information from the user's Zotero library entries. Do not use for general inquiries or unrelated questions.",
      ),
    input: z
      .object({
        question: z
          .string()
          .describe(
            "The specific question that can be answered using the Zotero library entries.",
          ),
      })
      .strict(),
  })
  .strict()

const ActionSchema = z.union([SearchActionSchema, QAActionSchema])

export const RouteSchema = z.object({
  message: z
    .string()
    .describe(
      "Either a direct response to user request or a brief explanation of the prescribed actions.",
    ),
  context: z
    .object({
      query: QuerySchema.optional(),
    })
    .strict(),
  actions: z
    .array(ActionSchema)
    .describe(
      "Prescribe optional actions based on user intent. The actions will be executed and the results presented to the user.",
    ),
})

export const routingFormat = zodResponseFormat(RouteSchema, "response")

// export const routingFormat = {
//   name: "response",
//   strict: true,
//   schema: {
//     $schema: "http://json-schema.org/draft-07/schema#",
//     additionalProperties: false,
//     definitions: {
//       condition: {
//         type: "object",
//         properties: {
//           condition: {
//             type: "string",
//             enum: [
//               "abstractNote",
//               "anyField",
//               "collection",
//               "creator",
//               "date",
//               "dateAdded",
//               "dateModified",
//               "itemType",
//               "note",
//               "tag",
//               "title",
//               "type",
//               "libraryID",
//             ],
//             description: "The field to apply the condition on.",
//           },
//           operator: {
//             type: "string",
//             enum: [
//               "contains",
//               "doesNotContain",
//               "is",
//               "isNot",
//               "beginsWith",
//               "isBefore",
//               "isAfter",
//             ],
//             description: "The operator to apply in the condition.",
//           },
//           value: {
//             type: "string",
//             description: "The value to compare against.",
//           },
//         },
//         required: ["condition", "operator", "value"],
//         additionalProperties: false,
//       },
//       query: {
//         type: ["object", "null"],
//         anyOf: [
//           {
//             type: "object",
//             properties: {
//               conditions: {
//                 type: "array",
//                 items: {
//                   $ref: "#/definitions/condition",
//                 },
//                 description: "List of search conditions to apply.",
//               },
//               match: {
//                 type: "string",
//                 enum: ["all", "any"],
//                 description: "Determines if all or any conditions must be met.",
//               },
//               title: {
//                 type: "string",
//                 description: "The title of the group of conditions.",
//               },
//             },
//             required: ["conditions", "match", "title"],
//             additionalProperties: false,
//           },
//           {
//             type: "object",
//             properties: {
//               boolean: {
//                 type: "string",
//                 enum: ["AND", "OR"],
//                 description: "Logical operator to combine subqueries.",
//               },
//               subqueries: {
//                 type: "array",
//                 items: {
//                   $ref: "#/definitions/query",
//                 },
//                 description: "List of subqueries or conditions to be combined.",
//               },
//             },
//             required: ["boolean", "subqueries"],
//             additionalProperties: false,
//           },
//         ],
//       },
//       action: {
//         type: "object",
//         anyOf: [
//           {
//             type: "object",
//             properties: {
//               widget: {
//                 type: "string",
//                 const: "search",
//                 description:
//                   "Action for retrieving a list of items from the Zotero library.",
//               },
//             },
//             required: ["widget"],
//             additionalProperties: false,
//           },
//           {
//             type: "object",
//             properties: {
//               widget: {
//                 type: "string",
//                 const: "qa",
//                 description:
//                   "Action for answering a question based on the Zotero library.",
//               },
//               input: {
//                 type: "object",
//                 properties: {
//                   question: {
//                     type: "string",
//                     description: "The question to be answered.",
//                   },
//                 },
//                 required: ["question"],
//                 additionalProperties: false,
//               },
//             },
//             required: ["widget", "input"],
//             additionalProperties: false,
//           },
//         ],
//       },
//     },
//     type: "object",
//     properties: {
//       actions: {
//         type: "array",
//         items: {
//           $ref: "#/definitions/action",
//         },
//         description:
//           "Optional action to be taken by the assistant based on user intent.",
//       },
//       context: {
//         type: "object",
//         properties: {
//           query: {
//             $ref: "#/definitions/query",
//           },
//         },
//         required: ["query"],
//         additionalProperties: false,
//       },
//       message: {
//         type: "string",
//         description:
//           "Either a direct response to user request or a brief explanation of the assistant action.",
//       },
//     },
//     required: ["message", "context", "actions"],
//   },
// }
