import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { searchItemsDef } from './search'
import { conditions, operators } from './const'

type Condition = {
  condition: typeof conditions[number]
  operator: typeof operators[number]
  value: string
}
type ConditionsGroup = {
  conditions: Condition[]
  match: 'all' | 'any'
  title: string
}
type Subquery = {
  boolean: 'AND' | 'OR'
  subqueries: (Subquery | ConditionsGroup)[]
}

const ConditionSchema = z.object({
  condition: z.enum(conditions).describe('The field to apply the condition on.'),
  operator: z.enum(operators).describe('The operator to apply in the condition.'),
  value: z.string().describe('The value to compare against.'),
})

const ConditionsGroupSchema = z.object({
  conditions: z.array(ConditionSchema).describe('List of search conditions to apply.'),
  match: z.enum(['all', 'any']).describe('Determines if all or any conditions must be met.'),
  title: z.string().describe("The title of the group of conditions.")
})

const NestedQuerySchema: z.ZodType<ConditionsGroup | Subquery> = z.lazy(() =>
  z.object({
    boolean: z.enum(['AND', 'OR']).describe('Logical operator to combine subqueries.'),
    subqueries: z.array(z.union([NestedQuerySchema, ConditionsGroupSchema])).describe('List of subqueries or conditions to be combined.'),
  }).describe("The search query to retrieve relevant items for the response.")
)

const RouteSchema = z.object({
  message: z
    .string()
    .describe(
      "Either a direct response to user request or a brief explanation of the assistant action to be taken in order to address the request. Ask for clarification if needed."
    ),
  context: z.optional(
    z.object({
      query: z.union([ConditionsGroupSchema, NestedQuerySchema])
    })
  ),
  action: z
    .optional(
      z.discriminatedUnion("widget", [
        z.object({
          widget: z.literal("search"),
          // input: NestedQuerySchema,
        }).describe("Use this action if the user request is to trieve a list of items from their Zotero library. The search query must be defined in the context."),
        z
          .object({ widget: z.literal('qa'), input: z.object({ question: z.string() }) })
          .describe("Use this action is the user request is to answer question based on their Zotero library. Rephrase the relevant messages into a standalone question that can be answered using the provided context. Avoid applying this action to general informational inquiries about Zotero."),
      ])
    )
    .describe("Optional action to be taken by the assistant based on the user request. Ask user for confirmation if necessary."),
}).describe("Provide a response in Markdown format. If the response completely satisfies the user's request, omit any further action. Otherwise the message must be consistent with the action.")

export const routingFormat = zodResponseFormat(RouteSchema, "response")