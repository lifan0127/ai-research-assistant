import { useState, useMemo } from 'react'
import { Message } from '../components/message/types'
import { generateMessageId } from '../../models/utils/identifiers'

export function useMessages() {
  const messageStore = addon.data.popup.messages
  const loadedMessages = useMemo(() => messageStore.loadMessages(), [])
  const [messages, setMessages] = useState<Message[]>(loadedMessages)

  function getMesssage(messageId: string, offset: number = 0) {
    const messageIndex = messages.findIndex(message => message.id === messageId)
    return messages[messageIndex + offset]
  }

  function addMessage(message: Partial<Message>) {
    const newMessage = { ...message, id: generateMessageId(), timestamp: new Date().toISOString() } as Message
    setMessages(messages => [...messages, newMessage])
    messageStore.appendMessage(newMessage)
  }

  // Update a message in place without changing other messages in the list.
  // This should be use to only update message metadata that doesn't affect the conversation flow.
  function editMessage(updatedMessage: Partial<Message>) {
    const messageIndex = messages.findIndex(message => message.id === updatedMessage.id)
    messages[messageIndex] = updatedMessage as Message
    messageStore.modifyMessage(messageIndex, updatedMessage as Message, false)
  }

  // Update a message and trim all subsequent messages in the conversation
  function updateMessage(updatedMessage: Partial<Message>) {
    const messageIndex = messages.findIndex(message => message.id === updatedMessage.id)
    const newMessage = { ...updatedMessage, timestamp: new Date().toISOString() } as Message
    setMessages(messages => [...messages.slice(0, messageIndex), newMessage])
    messageStore.modifyMessage(messageIndex, newMessage, true)
    return messages.slice(0, messageIndex)
  }

  function clearMessages() {
    setMessages(messages => [])
    messageStore.clearMessages()
  }

  return { messages, getMesssage, addMessage, editMessage, updateMessage, clearMessages }
}
