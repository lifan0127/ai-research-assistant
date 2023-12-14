import { Props as MarkdownProps } from '../widgets/Markdown'
import { Props as SearchResultsProps } from '../widgets/SearchResults'
import { Props as QAResponseProps } from '../widgets/QAResponse'
import { Props as ErrorProps } from '../widgets/Error'
import { InputProps } from '../input/Input'
import { States, MentionValue } from '../../../models/utils/states'

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
  widget: 'MARKDOWN' | 'SEARCH_RESULTS' | 'QA_RESPONSE' | 'ERROR'
  input: MarkdownProps | SearchResultsProps | QAResponseProps | ErrorProps
  _raw: string
  vote?: 'up' | 'down'
  messageSlice: Message[]
  submitFeedback: (
    content: FeedbackContent,
    editMessageVote: (vote: 'up' | 'down') => void,
    callback: (success: boolean) => void
  ) => void
  editMessage: (
    message: Omit<BotMessageProps, 'messageSlice' | 'submitFeedback' | 'editMessage' | 'copyId' | 'setCopyId'>
  ) => void
  copyId?: string
  setCopyId: (id: string) => void
}

export interface BotIntermediateStepProps {
  id: string
  timestamp: string
  type: 'BOT_INTERMEDIATE_STEP'
  widget: 'MARKDOWN'
  input: MarkdownProps
  copyId?: string
  setCopyId: (id: string) => void
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

export type Message = UserMessageProps | BotMessageProps | BotIntermediateStepProps
