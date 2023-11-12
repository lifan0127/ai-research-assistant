import { useState, useEffect } from 'react'
import { Message } from '../components/message/types'
import { generateMessageId } from '../../models/utils/identifiers'

export function useMessages() {
  const messageStore = addon.data.popup.messages
  const [messages, setMessages] = useState<Message[]>(
    messageStore.getKeys().map((key: string) => messageStore.getValue(key))
  )
  // useEffect(() => {
  //   // addon.data.popup.messages = messages
  // }, [messages])

  function addMessage(message: Partial<Message>) {
    const newMessage = { ...message, id: generateMessageId(), timestamp: new Date().toISOString() } as Message
    setMessages(messages => [...messages, newMessage])
    messageStore.setValue(newMessage.id, newMessage)
  }

  // Update a message in place without changing other messages in the list.
  // This should be use to only update message metadata that doesn't affect the conversation flow.
  function editMessage(updatedMessage: Partial<Message>) {
    const messageIndex = messages.findIndex(message => message.id === updatedMessage.id)
    messages[messageIndex] = updatedMessage as Message
    messageStore.setValue(updatedMessage.id, updatedMessage)
    // setMessages(messages => messages)
  }

  // Update a message and trim all subsequent messages in the conversation
  function updateMessage(updatedMessage: Partial<Message>) {
    const messageIndex = messages.findIndex(message => message.id === updatedMessage.id)
    const newMessage = { ...updatedMessage, timestamp: new Date().toISOString() } as Message
    setMessages(messages => [...messages.slice(0, messageIndex), newMessage])
    messageStore
      .getKeys()
      .slice(messageIndex)
      .forEach((key: string) => messageStore.deleteKey(key))
    messageStore.setValue(newMessage.id, newMessage)
    return messages.slice(0, messageIndex)
  }

  function clearMessages() {
    setMessages(messages => [])
    messageStore.getKeys().forEach((key: string) => messageStore.deleteKey(key))
  }

  return { messages, addMessage, editMessage, updateMessage, clearMessages }
}
