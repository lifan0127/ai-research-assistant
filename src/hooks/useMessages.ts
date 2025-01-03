import { useState, useEffect, useMemo, useReducer } from "react"
import {
  MessageInput,
  UserMessageInput,
  BotMessageInput,
} from "../typings/messages"
import { MessageStepInput, StepInput } from "../typings/steps"
import { generateMessageId, generateStepId, generateActionId } from "../utils/identifiers"
import { generateTimestamp } from "../utils/datetime"
import { Action } from "../typings/actions"
import { useAssistant } from "./useAssistant"
import { ResearchAssistant } from "../models/assistant"

interface MessagesState {
  id: string
  metadata: {
    title?: string
    description?: string
  }
  messages: MessageInput[]
}

type MessagesAction =
  | {
    type: "ADD_USER_MESSAGE"
    payload: UserMessageInput
  }
  | { type: "ADD_BOT_MESSAGE"; payload: BotMessageInput }
  | {
    type: "UPDATE_USER_MESSAGE"
    payload: { id: string; updates: Partial<UserMessageInput> }
  }
  | { type: "ADD_BOT_STEP"; payload: { messageId: string; step: StepInput } }
  | {
    type: "UPDATE_BOT_STEP"
    payload: {
      messageId: string
      stepId: string
      updates: Partial<StepInput>
    }
  }
  | {
    type: "ADD_BOT_ACTIONS"
    payload: { messageId: string; stepId: string; actions: Action[] }
  }
  | {
    type: "UPDATE_BOT_ACTION"
    payload: {
      messageId: string
      stepId: string
      actionId: string
      updates: Partial<Action>
    }
  }
  | { type: "LOAD_MESSAGES"; payload: string }
  | { type: "CLEAR_MESSAGES" }

function messagesReducer(
  state: MessagesState,
  action: MessagesAction,
  assistant: ResearchAssistant,
): MessagesState {
  const messageStore = addon.data.popup.messageStore
  switch (action.type) {
    case "ADD_USER_MESSAGE": {
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }
    }

    case "ADD_BOT_MESSAGE": {
      return {
        ...state,
        messages: [
          ...state.messages,
          action.payload.steps
            ? action.payload
            : { ...action.payload, steps: [] },
        ],
      }
    }

    case "UPDATE_USER_MESSAGE": {
      const messageIndex = state.messages.findIndex(
        (message) => message.id === action.payload.id,
      )
      const updatedMessages = [
        ...state.messages.slice(0, messageIndex),
        {
          ...(state.messages[messageIndex] as UserMessageInput),
          ...action.payload.updates,
        },
      ]
      return {
        ...state,
        messages: updatedMessages,
      }
    }

    case "ADD_BOT_STEP": {
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.type === "BOT_MESSAGE" &&
            message.id === action.payload.messageId
            ? { ...message, steps: [...message.steps, action.payload.step] }
            : message,
        ),
      }
    }

    // Update message step only
    case "UPDATE_BOT_STEP": {
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.type === "BOT_MESSAGE" &&
            message.id === action.payload.messageId
            ? {
              ...message,
              steps: message.steps.map((step) => {
                // No update for other steps
                if (step.id !== action.payload.stepId) {
                  return step
                }
                // For message step, need additional handling for adding actions
                if (step.type === "MESSAGE_STEP") {
                  const messageUpdate = action.payload.updates as Partial<MessageStepInput>
                  // If messages is part of the update, look for TEXT message type
                  if (messageUpdate?.messages) {
                    return {
                      ...step,
                      ...action.payload.updates,
                      messages: messageUpdate.messages.map((message) => {
                        // For TEXT message type, add ID to actions
                        if (message.type === "TEXT") {
                          return {
                            ...message,
                            text: {
                              ...message.text,
                              actions: message.text.actions?.map((action) => {
                                return { ...action, id: generateActionId() }
                              }),
                            },
                          }
                        }
                        // For other message types, return message as-is
                        return message
                      }),
                    } as MessageStepInput
                  }
                  // Update the step as-is, if messages is not part of the update
                  return {
                    ...step,
                    ...action.payload.updates,
                  } as MessageStepInput
                }
                // Update other types of step as-is
                return { ...step, ...action.payload.updates } as StepInput
              })
            }
            : message,
        ),
      }
    }

    case "ADD_BOT_ACTIONS": {
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.type === "BOT_MESSAGE" &&
            message.id === action.payload.messageId
            ? {
              ...message,
              steps: message.steps.map((step) =>
                step.type === "MESSAGE_STEP" &&
                  step.id === action.payload.stepId
                  ? {
                    ...step,
                    actions: step.message.actions
                      ? [...step.message.actions, action.payload.action]
                      : [action.payload.action],
                  }
                  : step,
              ),
            }
            : message,
        ),
      }
    }

    case "UPDATE_BOT_ACTION": {
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.type === "BOT_MESSAGE" &&
            message.id === action.payload.messageId
            ? {
              ...message,
              steps: message.steps.map((step) =>
                step.type === "MESSAGE_STEP" &&
                  step.id === action.payload.stepId
                  ? {
                    ...step,
                    messages: step.messages.map((message) => {
                      if (message.type !== "TEXT") {
                        return message
                      }
                      return {
                        ...message,
                        text: {
                          ...message.text,
                          actions: message.text.actions!.map((act) =>
                            act.id === action.payload.actionId
                              ? { ...act, ...action.payload.updates }
                              : act,
                          ),
                        },
                      }
                    }),
                  }
                  : step,
              ),
            }
            : message,
        ),
      }
    }

    case "LOAD_MESSAGES": {
      const messages = messageStore.loadMessages(action.payload)
      return {
        ...state,
        messages: messages,
      }
    }

    case "CLEAR_MESSAGES": {
      return {
        ...state,
        messages: [],
      }
    }

    default: {
      return state
    }
  }
}

export function useMessages(id: string) {
  const { assistant } = useAssistant()
  const [state, dispatch] = useReducer(
    (state: MessagesState, action: MessagesAction) =>
      messagesReducer(state, action, assistant),
    {
      id,
      metadata: {},
      messages: [],
    },
  )

  // Load messages from persistence on mount
  useEffect(() => {
    dispatch({ type: "LOAD_MESSAGES", payload: id })
  }, [id])

  function getMesssage(messageId: string, offset: number = 0) {
    const messageIndex = state.messages.findIndex(
      (message) => message.id === messageId,
    )
    return state.messages[messageIndex + offset]
  }

  function addUserMessage(
    message: Omit<UserMessageInput, "type" | "id" | "timestamp">,
  ) {
    const messageId = generateMessageId()
    const timestamp = generateTimestamp()
    dispatch({
      type: "ADD_USER_MESSAGE",
      payload: { ...message, type: "USER_MESSAGE", id: messageId, timestamp },
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
      payload: { ...message, type: "BOT_MESSAGE", id: messageId, timestamp },
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

  function addBotStep(
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

  function updateBotStep(
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
    metadata: state.metadata,
    messages: state.messages,
    getMesssage,
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
