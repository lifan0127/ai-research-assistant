import { useState, useEffect } from 'react'
import { UserMessageProps } from '../components/message/UserMessage'
import { BotMessageProps } from '../components/message/BotMessage'
import { BotIntermediateStepProps } from '../components/message/BotIntermediateStep'
import { generateMessageId } from '../../models/utils/identifiers'

export type Message = UserMessageProps | BotMessageProps | BotIntermediateStepProps

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>(addon.data.popup.messages)

  useEffect(() => {
    addon.data.popup.messages = messages
  }, [messages])

  function addMessage(message: Partial<Message>) {
    const newMessage = { ...message, id: generateMessageId(), timestamp: new Date().toISOString() } as Message
    setMessages(messages => [...messages, newMessage])
  }

  function updateMessage(updatedMessage: Partial<Message>) {
    const messageIndex = messages.findIndex(message => message.id === updatedMessage.id)
    setMessages(messages => [
      ...messages.slice(0, messageIndex),
      { ...updatedMessage, timestamp: new Date().toISOString() } as Message,
    ])
    return messages.slice(0, messageIndex)
  }

  function clearMessages() {
    setMessages(messages => [])
  }

  return { messages, addMessage, updateMessage, clearMessages }
}
