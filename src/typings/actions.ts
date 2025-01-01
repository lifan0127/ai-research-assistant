import { z } from "zod"
import { SearchActionSchema, QAActionSchema } from "../models/schemas/routing"

const BaseAction = {
  id: z.string(),
  timestamp: z.string(),
}

const Actions = z.union([
  SearchActionSchema.extend(BaseAction),
  QAActionSchema.extend(BaseAction),
])

export type Action = z.infer<typeof Actions>
