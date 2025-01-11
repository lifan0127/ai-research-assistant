import { useEffect, useCallback, useMemo, useReducer, useRef } from "react"
import {
  MessageContent,
  UserMessageContent,
  BotMessageContent,
  MessageStore
} from "../typings/messages"
import { StepContent, MessageStepContent } from "../typings/steps"
import { generateMessageId, generateStepId, generateActionId } from "../utils/identifiers"
import { generateTimestamp } from "../utils/datetime"
import { Action } from "../typings/actions"
import { useAssistant } from "./useAssistant"
import * as db from "../db/client"
import { debounce } from "lodash"
import { messagesReducer, MessagesAction } from "../db/store"
import { store as log } from "../utils/loggers"

export type ConversationInfo = Pick<MessageStore, "id" | "title" | "description" | "metadata">

function isBotMessageCompleted(message: BotMessageContent) {
  log("Checking bot message completeness", message)
  if (message.steps.length === 0) {
    return false
  }
  return message.steps.every((step) => {
    switch (step.type) {
      case "MESSAGE_STEP": {
        return step.status === "COMPLETED" && step.messages.every((message) => {
          if (message.type !== "TEXT") {
            return true
          }
          // Check if all actions are completed (such as QA)
          return message.text.actions?.every((action) => action.status === "COMPLETED")
        })
      }
      default: {
        return step.status === "COMPLETED"
      }
    }
  })
}

export function useMessages(currentConversation: ConversationInfo) {
  const { assistant } = useAssistant()
  const [state, dispatch] = useReducer(
    (state: MessageStore, action: MessagesAction) =>
      messagesReducer(state, action, assistant),
    {
      ...currentConversation,
      messages: [],
      pendingUpdate: [],
      pendingDelete: [],
    },
  )

  // Load messages from persistence on mount
  useEffect(() => {
    // DEV: Create a new conversation in database for testing purpose
    db.upsertConversation(currentConversation)

    // DEV: Clear the message database for testing purpose
    // db.clearAllMessages()

    db.getAllMessages(currentConversation.id).then((messages) => {
      dispatch({ type: "LOAD_MESSAGES", payload: messages as MessageContent[] })
    })
  }, [currentConversation.id])

  // Ref to hold the latest messages
  const messagesRef = useRef<MessageContent[]>(state.messages)

  // Update the ref whenever state.messages changes
  useEffect(() => {
    messagesRef.current = state.messages
  }, [state.messages])

  // Refs to hold the latest pending updates/deletes
  const pendingUpdateRef = useRef<string[]>(state.pendingUpdate)
  const pendingDeleteRef = useRef<string[]>(state.pendingDelete)

  // Update refs whenever state changes
  useEffect(() => {
    pendingUpdateRef.current = state.pendingUpdate
    pendingDeleteRef.current = state.pendingDelete
  }, [state.pendingUpdate, state.pendingDelete])

  // Define persistChanges function with no dependencies, using refs
  const persistChanges = useCallback(() => {
    const pendingUpdate = pendingUpdateRef.current.filter(
      (id) => !pendingDeleteRef.current.includes(id),
    )
    const pendingDelete = pendingDeleteRef.current

    if (pendingUpdate.length === 0 && pendingDelete.length === 0) {
      return
    }

    // Gather updated messages
    const updatedMessages = pendingUpdate.reduce(
      (acc: Omit<MessageContent, "stream">[], messageId: string) => {
        const message = messagesRef.current.find((m) => m.id === messageId)
        if (!message) {
          log("Missing message in store", messageId, message)
          return acc
        }
        if (message.type === "USER_MESSAGE") {
          return [...acc, message]
        } else if (message.type === "BOT_MESSAGE") {
          if (isBotMessageCompleted(message)) {
            const { stream, ...rest } = message
            log("Persist bot message", rest)
            return [...acc, rest]
          }
        }
        return acc
      },
      [],
    )

    if (updatedMessages.length) {
      log("Updated messages for persistence", updatedMessages)
    } else {
      log("No updated messages for persistence")
    }

    // Perform DB calls
    if (updatedMessages.length > 0) {
      db.upsertMessages(updatedMessages).catch((err) => console.error("DB upsert failed:", err))
    }
    if (pendingDelete.length > 0) {
      db.deleteMessages(pendingDelete).catch((err) => console.error("DB delete failed:", err))
    }

    // Clear pending arrays
    dispatch({ type: "CLEAR_PENDING" })
  }, [])

  // Initialize the debounced function once and store in ref
  const debouncedPersistChangesRef = useRef(debounce(persistChanges, 500))

  // Update the debounced function if persistChanges changes
  useEffect(() => {
    debouncedPersistChangesRef.current = debounce(persistChanges, 500)
    return () => {
      debouncedPersistChangesRef.current.cancel()
    }
  }, [persistChanges])

  // Effect to trigger debounced persistence on updates
  useEffect(() => {
    if (!state.pendingUpdate.length && !state.pendingDelete.length) {
      return
    }
    log("Triggering debounced persistence", state.pendingUpdate, state.pendingDelete)
    debouncedPersistChangesRef.current()
    // No cleanup here to prevent flushing on every state change
  }, [state.pendingUpdate, state.pendingDelete])

  // Effect to flush on component unmount
  useEffect(() => {
    return () => {
      log("Flush on component unmount")
      debouncedPersistChangesRef.current.flush()
    }
  }, [])

  // useEffect(() => {
  //   const pendingDelete = state.pendingDelete
  //   // Skip any updates if they are pending delete
  //   const pendingUpdate = state.pendingUpdate.filter(
  //     (id) => !pendingDelete.includes(id)
  //   )
  //   if (pendingUpdate.length > 0) {
  //     const updatedMessages = pendingUpdate.reduce(
  //       (messages: Omit<MessageInput, "stream">[], messageId: string) => {
  //         const message = state.messages.find((msg) => msg.id === messageId)
  //         if (!message) {
  //           return messages
  //         }
  //         switch (message.type) {
  //           case "USER_MESSAGE": {
  //             return [...messages, message]
  //           }
  //           case "BOT_MESSAGE": {
  //             if (isMessageCompleted(message)) {
  //               const { stream, ...rest } = message
  //               return [...messages, rest]
  //             }
  //             return messages
  //           }
  //         }
  //       },
  //       []
  //     )
  //     if (updatedMessages.length > 0) {
  //       db.upsertMessages(updatedMessages)
  //     }
  //   }
  //   if (pendingDelete.length > 0) {
  //     db.deleteMessages(pendingDelete)
  //   }
  //   if (pendingUpdate.length > 0 || pendingDelete.length > 0) {
  //     dispatch({ type: "CLEAR_PENDING" })
  //   }
  // }, [state.pendingUpdate, state.pendingDelete])

  const getMessage = useCallback((messageId: string, offset: number = 0) => {
    const messageIndex = state.messages.findIndex(
      (message) => message.id === messageId,
    )
    return state.messages[messageIndex + offset] as MessageContent
  }, [state.messages])

  const addUserMessage = useCallback((
    message: Omit<UserMessageContent, "type" | "id" | "timestamp">,
  ) => {
    const messageId = generateMessageId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_USER_MESSAGE",
      payload: { ...message, type: "USER_MESSAGE", id: messageId, timestamp, conversationId: currentConversation.id },
    })
    return messageId
  }, [currentConversation.id])

  const addBotMessage = useCallback((
    message: Omit<BotMessageContent, "type" | "id" | "timestamp">,
  ) => {
    const messageId = generateMessageId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_BOT_MESSAGE",
      payload: { ...message, type: "BOT_MESSAGE", id: messageId, timestamp, conversationId: currentConversation.id },
    })
    return messageId
  }, [currentConversation.id])

  const updateUserMessage = useCallback((
    messageId: string,
    partialMessage: Partial<
      Omit<UserMessageContent, "type" | "id" | "timestamp">
    >,
  ) => {
    dispatch({
      type: "UPDATE_USER_MESSAGE",
      payload: { id: messageId, updates: partialMessage },
    })
  }, [])

  const addBotStep = useCallback((
    messageId: string,
    step: Omit<StepContent, "id" | "messageId" | "timestamp">,
  ) => {
    const stepId = generateStepId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_BOT_STEP",
      payload: {
        messageId,
        step: { id: stepId, messageId, timestamp, ...step } as StepContent,
      },
    })
    return stepId
  }, [])

  const updateBotStep = useCallback((
    messageId: string,
    stepId: string,
    partialStep: Partial<Omit<StepContent, "id">> & Pick<StepContent, "type">,
  ) => {

    dispatch({
      type: "UPDATE_BOT_STEP",
      payload: { messageId, stepId, updates: partialStep },
    })
  }, [])

  const completeBotMessageStep = useCallback((
    messageId: string,
    stepId: string,
    partialStep: Partial<Omit<MessageStepContent, "id">> & Pick<MessageStepContent, "messages">,
  ) => {
    const { messages, ...rest } = partialStep
    dispatch({
      type: "UPDATE_BOT_STEP",
      payload: {
        messageId,
        stepId,
        updates: {
          ...rest,
          status: "COMPLETED",
          messages: messages.map((message) => {
            if (message.type === "TEXT") {
              return {
                ...message,
                text: {
                  ...message.text,
                  actions: (message.text.actions || []).map((action) => ({
                    ...action,
                    status: "IN_PROGRESS",
                    id: generateActionId()
                  }))
                }
              }
            }
            return message
          }),
        },
      },
    })
  }, [])

  const updateBotAction = useCallback((
    messageId: string,
    stepId: string,
    actionId: string,
    updates: Partial<Action>,
  ) => {
    dispatch({
      type: "UPDATE_BOT_ACTION",
      payload: { messageId, stepId, actionId, updates },
    })
  }, [])

  const clearMessages = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGES" })
  }, [])

  const findLastUserMessage = useCallback((id: string) => {
    const messageIndex = state.messages.findIndex(
      (message) => message.id === id,
    )
    if (messageIndex === -1) {
      return null
    }
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (state.messages[i].type === "USER_MESSAGE") {
        return state.messages[i] as UserMessageContent
      }
    }
    return null
  }, [state.messages])

  return {
    messages: state.messages,
    getMessage,
    addUserMessage,
    addBotMessage,
    updateUserMessage,
    addBotStep,
    updateBotStep,
    completeBotMessageStep,
    updateBotAction,
    clearMessages,
    findLastUserMessage,
  }
}

export type UseMessages = ReturnType<typeof useMessages>
