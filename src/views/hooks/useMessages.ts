import { useState, useEffect } from 'react'
import { Message } from '../components/message/types'
import { generateMessageId } from '../../models/utils/identifiers'

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>(addon.data.popup.messages)

  useEffect(() => {
    addon.data.popup.messages = messages
  }, [messages])

  function addMessage(message: Partial<Message>) {
    const newMessage = { ...message, id: generateMessageId(), timestamp: new Date().toISOString() } as Message
    setMessages(messages => [...messages, newMessage])
  }

  // Update a message in place without changing other messages in the list.
  // This should be use to only update message metadata that doesn't affect the conversation flow.
  function editMessage(updatedMessage: Partial<Message>) {
    const messageIndex = messages.findIndex(message => message.id === updatedMessage.id)
    messages[messageIndex] = updatedMessage as Message
    // setMessages(messages => messages)
  }

  // Update a message and trim all subsequent messages in the conversation
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

  return { messages, addMessage, editMessage, updateMessage, clearMessages }
}
