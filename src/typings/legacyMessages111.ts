import { Input as MarkdownInput } from "../views/features/messages/actions/Markdown"
import { SearchActionContent as SearchResultsInput } from "../views/features/messages/actions/SearchAction"
import { Input as QAResponseInput } from "../views/features/messages/actions/QAAction"
import { Input as ErrorInput } from "../views/features/messages/actions/ErrorAction"
import { InputProps } from "../views/features/input/Input"
import { States } from "../models/utils/states"
import { MentionValue } from './input'
import { Control } from "../views/components/types"
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs"

export interface FeedbackContent {
  id: string
  timestamp: string
  vote: "up" | "down"
  user: string | null
  messages: string
  env: "development" | "production"
}

export interface BotMessageProps {
  id: string
  timestamp: string
  type: "BOT_MESSAGE"
  stream?: any
  steps?: any[]
  status: BotMessageStatus
  error?: any
  action?: any
  vote?: "up" | "down"
  messageSlice: Message[]
  setFunctionCallsCount: (count: number) => void
  addFunctionCallOutput: (tool_call_id: string, output: string) => void
  submitFeedback: (
    content: FeedbackContent,
    editMessageVote: (vote: "up" | "down") => void,
    callback: (success: boolean) => void,
  ) => void
  editMessage: (
    message: Omit<
      BotMessageProps,
      | "messageSlice"
      | "submitFeedback"
      | "editMessage"
      | "copyId"
      | "setCopyId"
      | "scrollToEnd"
      | "persistMessage"
    >,
  ) => void
  persistMessage: (
    message: Omit<
      BotMessageProps,
      | "messageSlice"
      | "submitFeedback"
      | "editMessage"
      | "copyId"
      | "setCopyId"
      | "scrollToEnd"
      | "persistMessage"
    >,
  ) => void
  copyId?: string
  setCopyId: (id: string) => void
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
}

export interface UserMessageProps extends InputProps {
  id: string
  timestamp: string
  type: "USER_MESSAGE"
  content: MentionValue
  states: States
  copyId?: string
  setCopyId: (id: string) => void
  editId?: string
  setEditId: (id: string | undefined) => void
}

export type Message = UserMessageProps | BotMessageProps

export type BotMessageStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
