import { z } from "zod"
import { SearchActionSchema, QAActionSchema } from "../models/schemas/routing"
import { QuerySchema } from "../models/schemas/routing"
import { useMessages } from "../hooks/useMessages"

export type ActionStatus = "IN_PROGRESS" | "COMPLETED"

const BaseAction = {
  id: z.string(),
  timestamp: z.string(),
  output: z.any().optional(),
}

const Actions = z.union([
  SearchActionSchema.extend(BaseAction),
  QAActionSchema.extend(BaseAction),
])

export type Action = z.infer<typeof Actions> & {
  status: ActionStatus
}

export type Query = NonNullable<z.infer<typeof QuerySchema>>

interface BaseActionControl {
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
  updateBotAction: ReturnType<typeof useMessages>["updateBotAction"]
}

export interface SearchActionControl extends BaseActionControl {

}

export interface QAActionControl extends BaseActionControl { }

export interface ErrorActionControl extends BaseActionControl { }
