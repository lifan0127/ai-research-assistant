import { useEffect, useCallback, useMemo, useReducer, useRef } from "react"
import {
  MessageInput,
  UserMessageInput,
  BotMessageInput,
  MessageStore
} from "../../typings/messages"
import { StepInput } from "../../typings/steps"
import { generateMessageId, generateStepId } from "../../utils/identifiers"
import { generateTimestamp } from "../../utils/datetime"
import { Action } from "../../typings/actions"
import { useAssistant } from "../useAssistant"
import * as db from "../../db/client"
import { debounce } from "lodash"
import { messagesReducer, MessagesAction, log } from "./store"

export type ConversationInfo = Pick<MessageStore, "id" | "title" | "description" | "metadata">

function isBotMessageCompleted(message: BotMessageInput) {
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
          // TODO: Check if all actions are completed (such as QA)
          // return message.text.actions?.every((action) => action.status === "COMPLETED")
          return true
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
      dispatch({ type: "LOAD_MESSAGES", payload: messages as MessageInput[] })
    })
  }, [currentConversation.id])

  // Ref to hold the latest messages
  const messagesRef = useRef<MessageInput[]>(state.messages)

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
      (acc: Omit<MessageInput, "stream">[], messageId: string) => {
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

  function getMessage(messageId: string, offset: number = 0) {
    const messageIndex = state.messages.findIndex(
      (message) => message.id === messageId,
    )
    return state.messages[messageIndex + offset] as MessageInput
  }

  async function addUserMessage(
    message: Omit<UserMessageInput, "type" | "id" | "timestamp">,
  ) {
    const messageId = generateMessageId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_USER_MESSAGE",
      payload: { ...message, type: "USER_MESSAGE", id: messageId, timestamp, conversationId: currentConversation.id },
    })
    return messageId
  }

  function addBotMessage(
    message: Omit<BotMessageInput, "type" | "id" | "timestamp">,
  ) {
    const messageId = generateMessageId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_BOT_MESSAGE",
      payload: { ...message, type: "BOT_MESSAGE", id: messageId, timestamp, conversationId: currentConversation.id },
    })
    return messageId
  }

  function updateUserMessage(
    messageId: string,
    partialMessage: Partial<
      Omit<UserMessageInput, "type" | "id" | "timestamp">
    >,
  ) {
    dispatch({
      type: "UPDATE_USER_MESSAGE",
      payload: { id: messageId, updates: partialMessage },
    })
  }

  async function addBotStep(
    messageId: string,
    step: Omit<StepInput, "id" | "messageId" | "timestamp">,
  ) {
    const stepId = generateStepId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_BOT_STEP",
      payload: {
        messageId,
        step: { id: stepId, messageId, timestamp, ...step } as StepInput,
      },
    })
    return stepId
  }

  async function updateBotStep(
    messageId: string,
    stepId: string,
    partialStep: Partial<Omit<StepInput, "id">> & { type: StepInput["type"] },
  ) {
    dispatch({
      type: "UPDATE_BOT_STEP",
      payload: { messageId, stepId, updates: partialStep },
    })
  }

  function addBotAction(
    messageId: string,
    stepId: string,
    action: Omit<Action, "id" | "timestamp">,
  ) {
    const actionId = generateStepId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_BOT_ACTION",
      payload: {
        messageId,
        stepId,
        action: { id: actionId, timestamp, ...action } as Action,
      },
    })
    return actionId
  }

  function updateBotAction(
    messageId: string,
    stepId: string,
    actionId: string,
    updates: Partial<Action>,
  ) {
    dispatch({
      type: "UPDATE_BOT_ACTION",
      payload: { messageId, stepId, actionId, updates },
    })
  }

  function clearMessages() {
    dispatch({ type: "CLEAR_MESSAGES" })
  }

  function findLastUserMessage(id: string) {
    const messageIndex = state.messages.findIndex(
      (message) => message.id === id,
    )
    if (messageIndex === -1) {
      return null
    }
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (state.messages[i].type === "USER_MESSAGE") {
        return state.messages[i] as UserMessageInput
      }
    }
    return null
  }

  return {
    messages: state.messages,
    getMessage,
    addUserMessage,
    addBotMessage,
    updateUserMessage,
    addBotStep,
    updateBotStep,
    addBotAction,
    updateBotAction,
    clearMessages,
    findLastUserMessage,
  }
}

export type UseMessages = ReturnType<typeof useMessages>
