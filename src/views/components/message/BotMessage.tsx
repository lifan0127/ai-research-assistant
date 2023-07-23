import React from 'react'
import { Markdown, MarkdownProps } from '../widgets/Markdown'
import { SearchResults, SearchResultsProps } from '../widgets/SearchResults'
import { QAResponse, QAResponseProps } from '../widgets/QAResponse'

export interface BotMessageProps {
  id: string
  timestamp: string
  type: 'BOT_MESSAGE'
  widget: 'MARKDOWN' | 'SEARCH_RESULTS' | 'QA_RESPONSE'
  input: MarkdownProps | SearchResultsProps | QAResponseProps
}

function MessageContent({ widget, input }: BotMessageProps) {
  switch (widget) {
    case 'MARKDOWN': {
      return <Markdown content={(input as MarkdownProps).content} />
    }
    case 'SEARCH_RESULTS': {
      return <SearchResults {...(input as SearchResultsProps)} />
    }
    case 'QA_RESPONSE': {
      return <QAResponse {...(input as QAResponseProps)} />
    }
    default: {
      return <Markdown content={`Unknown widget: ${widget}. Input: ${JSON.stringify(input)}`} />
    }
  }
}

export function BotMessage(props: BotMessageProps) {
  const width = props.widget === 'SEARCH_RESULTS' ? 'w-[85%]' : 'w-auto max-w-[70%]'
  return (
    <div className={`relative self-start ${width} my-2 pb-2`}>
      <div className="bg-white p-2 [&>*]:mx-2 [&>*]:my-0 border border-neutral-500 rounded-xl shadow-md text-black break-words">
        <MessageContent {...props} />
      </div>
    </div>
  )
}
