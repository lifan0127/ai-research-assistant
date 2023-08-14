import React, { useState, useRef, useCallback } from 'react'
import { Square2StackIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'
import { Markdown, MarkdownProps, copyMarkdown } from '../widgets/Markdown'
import { SearchResults, SearchResultsProps, copySearchResults } from '../widgets/SearchResults'
import { QAResponse, QAResponseProps, copyQAResponse } from '../widgets/QAResponse'
import { Error, ErrorProps, copyError } from '../widgets/Error'

export interface BotMessageProps {
  id: string
  timestamp: string
  type: 'BOT_MESSAGE'
  widget: 'MARKDOWN' | 'SEARCH_RESULTS' | 'QA_RESPONSE' | 'ERROR'
  input: MarkdownProps | SearchResultsProps | QAResponseProps | ErrorProps
  _raw: string
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
    case 'ERROR': {
      return <Error {...(input as ErrorProps)} />
    }
    default: {
      return <Markdown content={`Unknown widget: ${widget}. Input: ${JSON.stringify(input)}`} />
    }
  }
}

function copyBotMessage({ widget, input }: BotMessageProps) {
  switch (widget) {
    case 'MARKDOWN': {
      return copyMarkdown(input as MarkdownProps)
    }
    case 'SEARCH_RESULTS': {
      return copySearchResults(input as SearchResultsProps)
    }
    case 'QA_RESPONSE': {
      return copyQAResponse(input as QAResponseProps)
    }
    case 'ERROR': {
      return copyError(input as ErrorProps)
    }
    default: {
      const textContent = '<pre>' + JSON.stringify(input, null, 2) + '</pre>'
      const htmlContent = marked(textContent)
      return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
    }
  }
}

export function BotMessage(props: BotMessageProps) {
  const [displayMenu, setDisplayMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const width = props.widget === 'SEARCH_RESULTS' ? 'w-full sm:w-[85%]' : 'w-auto max-w-full sm:max-w-[70%]'
  const isShortMessage = ref?.current?.offsetWidth && ref.current?.offsetWidth < 32

  const handleMouseEnter = useCallback(() => {
    !displayMenu && setDisplayMenu(true)
  }, [displayMenu])

  const handleMouseLeave = useCallback(() => {
    displayMenu && setDisplayMenu(false)
  }, [displayMenu])

  function handleCopy() {
    copyBotMessage(props)
    setDisplayMenu(false)
  }

  return (
    <div
      className={`relative self-start ${width} my-2 pb-2`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={ref}
        className="bg-white p-2 [&>*]:mx-2 [&_*]:my-0 [&_*]:leading-6 [&_ul]:pl-0 [&_ol]:pl-0 border border-neutral-500 rounded shadow-md text-black break-words"
      >
        <MessageContent {...props} />
      </div>
      {displayMenu && (
        <div className={`absolute pb-3 text-sm -top-8 ${isShortMessage ? 'left-0' : 'right-0 pl-12'}`}>
          <div className="bg-white mb-3 rounded border border-neutral-500 shadow-md text-black">
            <span className="isolate inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none px-2 py-1"
                aria-label="Copy"
                onClick={handleCopy}
              >
                <Square2StackIcon className="w-5 h-5 text-black" aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
