import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useMessages } from './hooks/useMessages'
import { TestButtons } from './components/test/testButtons'
import { AgentAction } from 'langchain/schema'
import { CallbackManager } from 'langchain/callbacks'
import { ResearchAssistant } from '../models/assistant'
import { ClarificationActionResponse, ExecutorActionResponse } from '../models/utils/actions'
import { UserMessage, UserMessageProps } from './components/message/UserMessage'
import { BotMessage, BotMessageProps } from './components/message/BotMessage'
import { BotIntermediateStep, BotIntermediateStepProps } from './components/message/BotIntermediateStep'
import { Header } from './components/Header'
import { Menu } from './components/Menu'
import { Input } from './components/Input'
import { ReleaseNote } from './components/ReleaseNote'
import { Version } from './components/Version'
import './style.css'

export default function Container(props: any, ref: any) {
  const [userInput, setUserInput] = useState<string>()
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
  ]
  const assistant = useMemo(() => new ResearchAssistant({ langChainCallbackManager, zoteroCallbacks }), [])

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
      { action, payload }: ClarificationActionResponse | ExecutorActionResponse,
      isSubscribed: boolean
    ) {
      switch (action) {
        case 'clarification': {
          const { message } = payload
          const newBotMessage = {
            type: 'BOT_MESSAGE' as const,
            widget: 'MARKDOWN' as const,
            input: {
              content: message,
            },
          }
          if (isSubscribed) {
            addMessage(newBotMessage)
          }
          return
        }
        default: {
          const { widget, input } = payload
          const newBotMessage = {
            type: 'BOT_MESSAGE' as const,
            widget,
            input: input as BotMessageProps['input'],
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
      assistant.call(userInput).then(response => {
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

  async function handleSubmit(content: string) {
    const newUserMessage = {
      type: 'USER_MESSAGE' as const,
      content,
    }

    addMessage(newUserMessage)

    if (isLoading) {
      setUserInput(userInput + '\n' + content)
    } else {
      setUserInput(content)
    }
  }

  async function handleTestClick() {
    await assistant.call('Hello!')
  }

  return (
    <div className="overflow-hidden px-3 py-4 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-4/5 min-w-720 rounded-xl bg-gradient-170 from-red-50 to-blue-50 shadow-[0_1.8px_7.3px_0_rgba(0,0,0,0.071),0_6.3px_24.7px_0_rgba(0,0,0,0.112),0_30px_90px_0_rgba(0,0,0,0.2)]">
      <div
        className="w-full h-[calc(100%-56px)] overflow-x-hidden overflow-y-scroll flex flex-col justify-start"
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
              return <UserMessage key={props.id} {...(props as UserMessageProps)} />
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
