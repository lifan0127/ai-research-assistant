import { z } from "zod"
import { WorkflowStepContent } from "./steps"
import { UseMessages } from "../hooks/useMessages"
import { SearchWorkflowSchema, QAWorkflowSchema } from "../models/schemas/routing"
import type { recursiveSearchAndCompileResults } from "../apis/zotero/search"

export type WorkflowStatus = "IN_PROGRESS" | "COMPLETED"

export type SearchWorkflowType = z.infer<typeof SearchWorkflowSchema> & {
  output: ReturnType<typeof recursiveSearchAndCompileResults>
}

export type QAWorkflowType = z.infer<typeof QAWorkflowSchema> & {
  output: any
}

export type FlowStepFunction = (
  step: WorkflowStepContent,
  messageOps: {
    addBotMessage: UseMessages["addBotMessage"],
    addBotStep: UseMessages["addBotStep"],
    updateBotStep: UseMessages["updateBotStep"],
    updateBotAction: UseMessages["updateBotAction"],
  }
) => Promise<string | null> | string | null
