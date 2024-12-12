import { Input as MarkdownInput } from './widgets/Markdown'
import { Input as SearchResultsInput } from './widgets/Search'
import { Input as QAResponseInput } from './widgets/QA'
import { Input as ErrorInput } from './widgets/Error'
import { InputProps } from '../input/Input'
import { States, MentionValue } from '../../../models/utils/states'
import { Control } from '../../components/types'
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs"

export interface FeedbackContent {
  id: string
  timestamp: string
  vote: 'up' | 'down'
  user: string | null
  messages: string
  env: 'development' | 'production'
}

export interface BotMessageProps {
  id: string
  timestamp: string
  type: 'BOT_MESSAGE'
  stream?: any
  content?: string
  error?: any
  action?: any
  vote?: 'up' | 'down'
  messageSlice: Message[]
  setFunctionCallsCount: (count: number) => void
  addFunctionCallOutput: (tool_call_id: string, output: string) => void
  submitFeedback: (
    content: FeedbackContent,
    editMessageVote: (vote: 'up' | 'down') => void,
    callback: (success: boolean) => void
  ) => void
  editMessage: (
    message: Omit<BotMessageProps, 'messageSlice' | 'submitFeedback' | 'editMessage' | 'copyId' | 'setCopyId' | 'scrollToEnd' | 'persistMessage'>
  ) => void
  persistMessage: (message: Omit<BotMessageProps, 'messageSlice' | 'submitFeedback' | 'editMessage' | 'copyId' | 'setCopyId' | 'scrollToEnd' | 'persistMessage'>) => void
  copyId?: string
  setCopyId: (id: string) => void
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
}

export interface UserMessageProps extends InputProps {
  id: string
  timestamp: string
  type: 'USER_MESSAGE'
  content: MentionValue
  states: States
  copyId?: string
  setCopyId: (id: string) => void
  editId?: string
  setEditId: (id: string | undefined) => void
}

export type Message = UserMessageProps | BotMessageProps

export type BotMessageStatus = "begin" | "streaming" | "done" | "aborted" | "error"