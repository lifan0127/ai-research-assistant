import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  HandThumbUpIcon as HandThumbUpIconOutline,
  HandThumbDownIcon as HandThumbDownIconOutline,
} from '@heroicons/react/24/outline'
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
} from '@heroicons/react/24/solid'
import { findLast } from 'lodash'
import { marked } from 'marked'
import * as Markdown from '../widgets/Markdown'
import * as SearchResults from '../widgets/SearchResults'
import * as QAResponse from '../widgets/QAResponse'
import * as Error from '../widgets/Error'
import { BotIntermediateStepProps, BotMessageProps, UserMessageProps } from './types'
import { anonymizeError } from '../../../models/utils/error'
import { CopyButton } from '../buttons/CopyButton'
import { NoteButton } from '../buttons/NoteButton'
import { AnnotateButton } from '../buttons/AnnotateButton'

const widgetMap = {
  MARKDOWN: Markdown,
  SEARCH_RESULTS: SearchResults,
  QA_RESPONSE: QAResponse,
  ERROR: Error,
}

function MessageContent({ widget, input }: Pick<BotMessageProps, 'widget' | 'input'>) {
  const Widget = widgetMap[widget]
  if (Widget !== undefined) {
    return <Widget.Component {...(input as any)} />
  }
  return <Markdown.Component content={`Unknown widget: ${widget}. Input: ${JSON.stringify(input)}`} />
  // switch (widget) {
  //   case 'MARKDOWN': {
  //     return <Markdown.Component content={(input as Markdown.Props).content} />
  //   }
  //   case 'SEARCH_RESULTS': {
  //     return <SearchResults.Component {...(input as SearchResultsProps)} />
  //   }
  //   case 'QA_RESPONSE': {
  //     return <QAResponse {...(input as QAResponseProps)} />
  //   }
  //   case 'ERROR': {
  //     return <Error {...(input as ErrorProps)} />
  //   }
  //   default: {
  //     return <Markdown content={`Unknown widget: ${widget}. Input: ${JSON.stringify(input)}`} />
  //   }
  // }
}

function defaultCopy(input: any) {
  const textContent = '<pre>' + JSON.stringify(input, null, 2) + '</pre>'
  const htmlContent = marked(textContent)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}

interface MessageActionsProps extends Pick<BotMessageProps, 'id' | 'widget' | 'input' | 'copyId' | 'setCopyId'> {
  states?: UserMessageProps['states']
}

function MessageActions({ id, widget, input, copyId, setCopyId, states }: MessageActionsProps) {
  const Widget = widgetMap[widget]

  if (Widget !== undefined) {
    return (
      <>
        {Widget.buttonDefs.map(({ name, utils }, index) => {
          switch (name) {
            case 'COPY': {
              return (
                <CopyButton
                  key={index}
                  copyId={copyId}
                  setCopyId={setCopyId}
                  id={id}
                  name={name}
                  utils={utils}
                  input={input}
                />
              )
            }
            case 'NOTE': {
              return <NoteButton key={index} name={name} utils={utils} input={input} states={states} />
            }
            case 'ANNOTATION': {
              return <AnnotateButton key={index} name={name} utils={utils} input={input} states={states} />
            }
            default: {
              return null
            }
          }
        })}
      </>
    )
  }
  return (
    <CopyButton
      copyId={copyId}
      setCopyId={setCopyId}
      id={id}
      name="COPY"
      utils={{
        copy: defaultCopy,
      }}
      input={input}
    />
  )
}

export function BotMessage({
  submitFeedback,
  messageSlice,
  editMessage,
  copyId,
  setCopyId,
  ...message
}: BotMessageProps) {
  const [vote, setVote] = useState(message.vote)
  const [error, setError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const width = message.widget === 'SEARCH_RESULTS' ? 'w-full sm:w-[85%]' : 'w-auto max-w-full sm:max-w-[70%]'

  const lastUserMessage = findLast(messageSlice, message => message.type === 'USER_MESSAGE')
  const states = (lastUserMessage as UserMessageProps)?.states

  useEffect(() => {
    setVote(message.vote)
  }, [message.vote])

  function handleVote(vote: 'up' | 'down') {
    const { id, timestamp } = message
    const serializedMessages = JSON.stringify(
      messageSlice.map(message => {
        const input = (message as BotMessageProps | BotIntermediateStepProps).input
        if (message.type === 'BOT_MESSAGE' && message.widget === 'ERROR') {
          const errorInput = input as Error.Props
          if (errorInput.error.stack && typeof errorInput.error.stack === 'string') {
            errorInput.error.stack = anonymizeError(errorInput.error.stack)
          }
        }
        let purgedStates
        if (message.type === 'USER_MESSAGE' && message.states.images.length > 0) {
          const states = (message as UserMessageProps).states
          purgedStates = {
            ...states,
            images: states.images.map(({ image, ...rest }) => ({
              ...rest,
              image: image.slice(0, 64) + '...',
            })),
          }
        }
        return {
          id: message.id,
          timestamp: message.timestamp,
          type: message.type,
          content: (message as UserMessageProps).content,
          states: purgedStates,
          widget: (message as BotMessageProps | BotIntermediateStepProps).widget,
          input,
        }
      })
    )

    submitFeedback(
      { id, timestamp, vote, user: null, messages: serializedMessages, env: __env__ },
      (vote: 'up' | 'down') => editMessage({ ...message, type: 'BOT_MESSAGE', vote }),
      (success: boolean) => {
        if (success) {
          setVote(vote)
          setError(false)
        } else {
          setError(true)
        }
      }
    )
  }

  return (
    <div className={`relative self-start ${width} my-2 pb-2`}>
      <div
        ref={ref}
        className="bg-white p-2 [&>*]:mx-2 [&_*]:my-0 [&_*]:leading-6 [&_ul]:pl-0 [&_ol]:pl-0 border border-neutral-500 rounded shadow-md text-black break-words"
      >
        <MessageContent {...message} />
        <div className="flex pt-3">
          <div className="flex-none flex space-x-2">
            <MessageActions {...message} copyId={copyId} setCopyId={setCopyId} states={states} />
          </div>
          <div className="flex-auto"></div>
          <div className="flex-none flex flex-col">
            <div className="self-end">
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none px-2 py-1"
                aria-label="ThumbUp"
                onClick={() => handleVote('up')}
              >
                {vote === 'up' ? (
                  <HandThumbUpIconSolid className="w-5 h-5 text-tomato" aria-hidden="true" />
                ) : (
                  <HandThumbUpIconOutline className="w-5 h-5 text-neutral-500" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none px-2 py-1"
                aria-label="ThumbDown"
                onClick={() => handleVote('down')}
              >
                {vote === 'down' ? (
                  <HandThumbDownIconSolid className="w-5 h-5 text-tomato" aria-hidden="true" />
                ) : (
                  <HandThumbDownIconOutline className="w-5 h-5 text-neutral-500" aria-hidden="true" />
                )}
              </button>
            </div>
            {error ? <div className="text-xs text-red-500">Failed to submit feedback</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
