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

export const QuerySchema: z.ZodType<Query> = z
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
  .describe("Zotero search query to be used in search and qa workflows. The query should be consistent with the description of the corresponding workflow invokation.")

export const SearchWorkflowSchema = z
  .object({
    type: z
      .literal("search")
      .describe(
        "Workflow for retrieving a list of items from the Zotero library.",
      ),
  })
  .strict()

export const QAWorkflowSchema = z
  .object({
    type: z
      .literal("qa")
      .describe(
        "Use this workflow to answer specific questions that involves retrieving and synthesizing information from the user's Zotero library entries. Do not use for general inquiries or unrelated questions.",
      ),
    input: z
      .object({
        question: z
          .string()
          .describe(
            "The specific question that can be answered using the Zotero library entries.",
          ),
        fulltext: z.boolean().describe("Whether fulltext is needed to answer the question or metadata is sufficient."),
      })
      .strict(),
  })
  .strict()

export const WorkflowSchema = z.union([SearchWorkflowSchema, QAWorkflowSchema])

const MessageSchema = z
  .string()
  .describe(
    "Either a direct response to user request or a brief explanation of the prescribed workflows. The workflows will be executed and presented to the user following this message.")

const ContextSchema = z
  .object({
    query: QuerySchema.optional(),
    itemIds: z.array(z.string()).optional(),
  })
  .strict()

export const RouteSchema = z.object({
  message: MessageSchema,
  context: ContextSchema,
  workflows: z
    .array(WorkflowSchema)
    .describe(
      "Prescribe optional workflows based on user intent. The workflows will be executed and the results presented to the user.",
    ),
})

export const routingFormat = zodResponseFormat(RouteSchema, "response")

export type RoutingOutput = z.infer<typeof RouteSchema>

export type RoutingOutputWorkflow = z.infer<typeof WorkflowSchema>