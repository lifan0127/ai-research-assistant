import { useState } from 'react'
import { UserMessageProps } from '../components/message/UserMessage'
import { BotMessageProps } from '../components/message/BotMessage'
import { BotIntermediateStepProps } from '../components/message/BotIntermediateStep'
import { generateMessageId } from '../../models/utils/identifiers'

export type Message = UserMessageProps | BotMessageProps | BotIntermediateStepProps

export function useMessages(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  function addMessage(message: Partial<Message>) {
    setMessages(messages => [
      ...messages,
      { ...message, id: generateMessageId(), timestamp: new Date().toISOString() } as Message,
    ])
  }

  function updateMessage(updatedMessage: Message) {
    setMessages(
      messages.map(message =>
        message.id === updatedMessage.id ? { ...updatedMessage, timestamp: new Date().toISOString() } : message
      )
    )
  }

  function clearMessages() {
    setMessages(messages => [])
  }

  return { messages, addMessage, updateMessage, clearMessages }
}
