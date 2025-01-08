import { z } from "zod"
import { RouteSchema } from "../models/schemas/routing"
import { Text } from "openai/resources/beta/threads/messages"
import { serializeError } from "serialize-error"
import { useMessages } from "../hooks/useMessages/hook"

type StepStatus = "IN_PROGRESS" | "COMPLETED"

interface BaseStepInput {
  id: string
  messageId: string
  timestamp: string
  status: StepStatus
}

export type StructuredMessage = z.infer<typeof RouteSchema>

export interface TextMessageContent {
  type: "TEXT"
  text: {
    raw?: Text
    message?: StructuredMessage["message"]
    context?: StructuredMessage["context"]
    actions?: StructuredMessage["actions"] & { id: string }
  }
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
    id: string // OpenAI tool call ID
    name: string
    parameters: any
    output?: string
  }
}

export interface ErrorStepInput extends BaseStepInput {
  type: "ERROR_STEP"
  error: {
    message: string
    stack: ReturnType<typeof serializeError>
  }
}

export type StepInput = MessageStepInput | ToolStepInput | ErrorStepInput

interface BaseStepControl {
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
}

export interface MessageStepControl extends BaseStepControl {
  save: (content: any) => void
  updateBotAction: ReturnType<typeof useMessages>["updateBotAction"]
}

export interface ToolStepControl extends BaseStepControl {
  addFunctionCallOutput: (tool_call_id: string, output: string) => void
  updateBotStep: ReturnType<typeof useMessages>["updateBotStep"]
}
