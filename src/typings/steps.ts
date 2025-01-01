import { z } from "zod"
import { RouteSchema } from "../models/schemas/routing"

type StepStatus = "IN_PROGRESS" | "COMPLETED"

interface BaseStepInput {
  id: string
  timestamp: string
  status: StepStatus
}

export interface TextMessageContent {
  type: "TEXT"
  text: z.infer<typeof RouteSchema>
}

export interface ImageMessageContent {
  type: "IMAGE"
  image: string
}

export interface MessageStepInput extends BaseStepInput {
  type: "MESSAGE_STEP"
  messages: (TextMessageContent | ImageMessageContent)[]
}

export interface ToolStepInput extends BaseStepInput {
  type: "TOOL_STEP"
  tool: {
    name: string
    parameters: any
    result?: string
  }
}

export interface ErrorStepInput extends BaseStepInput {
  type: "ERROR_STEP"
  error: {
    message: string
    stack: string
  }
}

export type StepInput = MessageStepInput | ToolStepInput | ErrorStepInput
