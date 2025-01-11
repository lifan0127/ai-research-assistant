import { z } from "zod"
import { RoutingOutput } from "../models/schemas/routing"
import { Text } from "openai/resources/beta/threads/messages"
import { serializeError } from "serialize-error"
import { useMessages } from "../hooks/useMessages"
import type { Action } from "./actions"

type StepStatus = "IN_PROGRESS" | "COMPLETED"

interface BaseStepContent {
  id: string
  messageId: string
  timestamp: string
  status: StepStatus
}

export interface TextMessageContent {
  type: "TEXT"
  text: {
    raw?: Text
    message?: RoutingOutput["message"]
    context?: RoutingOutput["context"]
    actions?: Action[]
  }
}

export interface ImageMessageContent {
  type: "IMAGE"
  image: string
}

export interface MessageStepContent extends BaseStepContent {
  type: "MESSAGE_STEP"
  messages: (TextMessageContent | ImageMessageContent)[]
}

export interface ToolStepContent extends BaseStepContent {
  type: "TOOL_STEP"
  tool: {
    id: string // OpenAI tool call ID
    name: string
    parameters: any
    output?: string
  }
}

export interface ErrorStepContent extends BaseStepContent {
  type: "ERROR_STEP"
  error: {
    message: string
    stack: ReturnType<typeof serializeError>
  }
}

export type StepContent = MessageStepContent | ToolStepContent | ErrorStepContent

interface BaseStepControl {
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
}

export interface MessageStepControl extends BaseStepControl {
  updateBotAction: ReturnType<typeof useMessages>["updateBotAction"]
}

export interface ToolStepControl extends BaseStepControl {
  addFunctionCallOutput: (tool_call_id: string, output: string) => void
  updateBotStep: ReturnType<typeof useMessages>["updateBotStep"]
}

export type ErrorStepControl = BaseStepControl