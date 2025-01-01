import { AssistantStream } from "openai/lib/AssistantStream"
import { StepInput } from "./steps"

interface BaseMessageInput {
  id: string
  timestamp: string
}

export interface UserMessageInput extends BaseMessageInput {
  type: "USER_MESSAGE"
  content: any
  states: any
}

export interface BotMessageInput extends BaseMessageInput {
  type: "BOT_MESSAGE"
  stream?: AssistantStream
  steps: StepInput[]
}

export type MessageInput = UserMessageInput | BotMessageInput
