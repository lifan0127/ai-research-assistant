import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useMessages } from './hooks/useMessages'
import { TestButtons } from './components/test/testButtons'
import { AgentAction } from 'langchain/schema'
import { CallbackManager } from 'langchain/callbacks'
import { ResearchAssistant } from '../models/assistant'
import { ClarificationActionResponse, ErrorActionResponse, ExecutorActionResponse } from '../models/utils/actions'
import { UserMessage, UserMessageProps } from './components/message/UserMessage'
import { BotMessage, BotMessageProps } from './components/message/BotMessage'
import { BotIntermediateStep, BotIntermediateStepProps } from './components/message/BotIntermediateStep'
import { Header } from './components/Header'
import { Menu } from './components/Menu'
import { Input } from './components/Input'
import { ReleaseNote } from './components/ReleaseNote'
import { Version } from './components/Version'
import './style.css'
// import { Portal } from './Portal'

interface UserInput {
  content: string
}

let visibility: 'visible' | 'hidden' = 'visible'
export let setVisibility: any

export default function Container(props: any, ref: any) {
  ;[visibility, setVisibility] = useState(visibility)
  const [userInput, setUserInput] = useState<UserInput>()
  const [displayMode, setDisplayMode] = useState<'normal' | 'minimal'>('normal')
  const { messages, addMessage, updateMessage, clearMessages } = useMessages()
  const [isUpdate, setIsUpdate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const conversationRef = useRef<HTMLDivElement>(null)
  const langChainCallbackManager = CallbackManager.fromHandlers({
    handleChainStart: (chain, inputs) => {
      const { key, title } = (chain as any)?.kwargs?.llm_kwargs
      switch (key) {
        case 'router-chain': {
          break
        }
        case 'qa-chain': {
          const newBotIntermediateStep = {
            type: 'BOT_INTERMEDIATE_STEP' as const,
            widget: 'MARKDOWN' as const,
            input: {
              content: `${title} (this may take some time...)`,
            },
          }
          addMessage(newBotIntermediateStep)
          break
        }
        default: {
          const newBotIntermediateStep = {
            type: 'BOT_INTERMEDIATE_STEP' as const,
            widget: 'MARKDOWN' as const,
            input: {
              content: `${title} (__Input:__ ${(inputs as any).input})`,
              // content: (
              //   <div>
              //     {title}{' '}
              //     <small>
              //       (<b>Input:</b>
              //       {(inputs as any).input})
              //     </small>
              //   </div>
              // ),
            },
          }
          addMessage(newBotIntermediateStep)
        }
      }
      setIsLoading(true)
    },
    handleChainEnd: (chain, inputs) => {
      setIsLoading(false)
    },
    handleAgentAction: (action: AgentAction) => {
      console.log(action)
    },
  })
  const zoteroCallbacks = {
    handleZoteroActionStart: (action: string) => {
      const newBotIntermediateStep = {
        type: 'BOT_INTERMEDIATE_STEP' as const,
        widget: 'MARKDOWN' as const,
        input: {
          content: action || 'Zotero internal action',
        },
      }
      addMessage(newBotIntermediateStep)
    },
    handleZoteroActionEnd: () => {},
  }
  const errorCallbacks = {
    handleErrorEnd: () => {
      setIsLoading(false)
    },
  }
  const menuItems = [
    {
      label: 'Clear chat history',
      handleClick: () => {
        clearMessages()
        assistant.resetMemory()
      },
    },
    {
      label: 'Feedback',
      handleClick: () => {
        Zotero.launchURL(`https://github.com/lifan0127/ai-research-assistant/issues`)
      },
    },
    {
      label: 'Close',
      handleClick: () => {
        setVisibility('hidden')
      },
    },
  ]
  const assistant = useMemo(
    () => new ResearchAssistant({ langChainCallbackManager, zoteroCallbacks, errorCallbacks }),
    []
  )

  useEffect(() => {
    const id = setTimeout(() => {
      if (conversationRef.current) {
        conversationRef.current.scrollTop = conversationRef.current.scrollHeight
      }
    }, 50)
    return () => clearTimeout(id)
  })

  useEffect(() => {
    function handleAction(
      { action, payload }: ClarificationActionResponse | ErrorActionResponse | ExecutorActionResponse,
      isSubscribed: boolean
    ) {
      switch (action) {
        case 'clarification': {
          const { message, _raw } = payload
          const newBotMessage = {
            type: 'BOT_MESSAGE' as const,
            widget: 'MARKDOWN' as const,
            input: {
              content: message,
            },
            _raw,
          }
          if (isSubscribed) {
            addMessage(newBotMessage)
          }
          return
        }
        case 'error': {
          const { error, _raw } = payload
          const newBotMessage = {
            type: 'BOT_MESSAGE' as const,
            widget: 'ERROR' as const,
            input: {
              error,
            },
            _raw,
          }
          if (isSubscribed) {
            addMessage(newBotMessage)
          }
          return
        }
        default: {
          const { widget, input, _raw } = payload
          const newBotMessage = {
            type: 'BOT_MESSAGE' as const,
            widget,
            input: input as BotMessageProps['input'],
            _raw,
          }
          if (isSubscribed) {
            addMessage(newBotMessage)
          }
          return
        }
      }
    }
    let isSubscribed = true
    if (userInput) {
      assistant.call(userInput.content).then(response => {
        try {
          handleAction(response as ClarificationActionResponse | ExecutorActionResponse, isSubscribed)
        } catch (e) {
          console.error(e)
        }
      })
    }
    return () => {
      isSubscribed = false
    }
  }, [userInput])

  async function handleSubmit(content: string, id?: string) {
    if (id) {
      const updatedUserMessage = {
        type: 'USER_MESSAGE' as const,
        id,
        content,
      }
      assistant.rebuildMemory(updateMessage(updatedUserMessage))
      setUserInput({ content })
    } else {
      const newUserMessage = {
        type: 'USER_MESSAGE' as const,
        content,
      }

      addMessage(newUserMessage)

      if (isLoading) {
        setUserInput({ content: userInput?.content + '\n' + content })
      } else {
        setUserInput({ content })
      }
    }
  }

  async function handleTestClick() {
    await assistant.call('Hello!')
  }

  return (
    <div
      className="fixed m-0 w-[calc(100%-20px)] h-full px-3 pt-0 pb-4 bg-gradient-170 from-red-50 to-blue-50"
      style={{ visibility }}
    >
      <div
        className="w-full h-[calc(100%-74px)] overflow-x-hidden overflow-y-scroll flex flex-col justify-start"
        ref={conversationRef}
      >
        <Header />
        <Menu items={menuItems} />
        {__env__ === 'development' && (
          <TestButtons setUserInput={setUserInput} addMessage={addMessage} onClick={handleTestClick} />
        )}
        {messages.length === 0 ? <ReleaseNote /> : null}
        {messages.map(({ type, ...props }) => {
          switch (type) {
            case 'USER_MESSAGE': {
              return <UserMessage key={props.id} {...(props as UserMessageProps)} onSubmit={handleSubmit} />
            }
            case 'BOT_MESSAGE': {
              return <BotMessage key={props.id} {...(props as BotMessageProps)} />
            }
            case 'BOT_INTERMEDIATE_STEP': {
              return <BotIntermediateStep key={props.id} {...(props as BotIntermediateStepProps)} />
            }
          }
        })}
      </div>
      <Input onSubmit={handleSubmit} isLoading={isLoading} />
      <Version />
    </div>
  )
}
