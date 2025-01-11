import { AssistantStream } from "openai/lib/AssistantStream"
import { StepContent } from "./steps"

interface BaseMessageContent {
  id: string
  conversationId: string
  timestamp: string
}

export interface UserMessageContent extends BaseMessageContent {
  type: "USER_MESSAGE"
  content: any
  states: any
}

export interface BotMessageContent extends BaseMessageContent {
  type: "BOT_MESSAGE"
  stream?: AssistantStream
  steps: StepContent[]
}

export type MessageContent = UserMessageContent | BotMessageContent

export interface MessageStore {
  id: string
  title?: string
  description?: string
  metadata: {
    vendor: "openai"
    threadId: string
  }
  messages: MessageContent[]
  pendingUpdate: string[]
  pendingDelete: string[]
}