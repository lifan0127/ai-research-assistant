import {
  UserMessageContent,
  BotMessageContent,
  MessageStore
} from "../typings/messages"
import { MessageStepContent, StepContent, TextMessageContent } from "../typings/steps"
import { MessageContent } from "../typings/messages"
import { generateActionId } from "../utils/identifiers"
import { Action } from "../typings/actions"
import { ResearchAssistant } from "../models/assistant"
import { store as log } from "../utils/loggers"

export type MessagesAction =
  | {
    type: "ADD_USER_MESSAGE"
    payload: UserMessageContent
  }
  | { type: "ADD_BOT_MESSAGE"; payload: BotMessageContent }
  | {
    type: "UPDATE_USER_MESSAGE"
    payload: { id: string; updates: Partial<UserMessageContent> }
  }
  | { type: "ADD_BOT_STEP"; payload: { messageId: string; step: StepContent } }
  | {
    type: "UPDATE_BOT_STEP"
    payload: {
      messageId: string
      stepId: string
      updates: Partial<StepContent>
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
  | { type: "LOAD_MESSAGES"; payload: MessageContent[] }
  | { type: "CLEAR_MESSAGES" }
  | { type: "CLEAR_PENDING" }

export function messagesReducer(
  state: MessageStore,
  action: MessagesAction,
  assistant: ResearchAssistant,
): MessageStore {
  switch (action.type) {
    case "ADD_USER_MESSAGE": {
      log("Add user message", action.payload)
      return {
        ...state,
        messages: [...state.messages, action.payload],
        pendingUpdate: state.pendingUpdate.includes(action.payload.id) ? state.pendingUpdate : [...state.pendingUpdate, action.payload.id],
      }
    }

    case "ADD_BOT_MESSAGE": {
      log("Add bot message", action.payload)
      return {
        ...state,
        messages: [
          ...state.messages,
          action.payload.steps
            ? action.payload
            : { ...action.payload, steps: [] },
        ],
        pendingUpdate: state.pendingUpdate.includes(action.payload.id) ? state.pendingUpdate : [...state.pendingUpdate, action.payload.id],
      }
    }

    case "UPDATE_USER_MESSAGE": {
      log("Update user message", action.payload)
      const messageIndex = state.messages.findIndex(
        (message) => message.id === action.payload.id,
      )
      const updatedMessages = [
        ...state.messages.slice(0, messageIndex),
        {
          ...(state.messages[messageIndex] as UserMessageContent),
          ...action.payload.updates,
        },
      ]
      return {
        ...state,
        messages: updatedMessages,
        pendingUpdate: state.pendingUpdate.includes(action.payload.id) ? state.pendingUpdate : [...state.pendingUpdate, action.payload.id],
      }
    }

    case "ADD_BOT_STEP": {
      log("Add bot step", action.payload)
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.type === "BOT_MESSAGE" &&
            message.id === action.payload.messageId
            ? { ...message, steps: [...message.steps, action.payload.step] }
            : message,
        ),
        pendingUpdate: state.pendingUpdate.includes(action.payload.messageId) ? state.pendingUpdate : [...state.pendingUpdate, action.payload.messageId],
      }
    }

    // Update message step only
    case "UPDATE_BOT_STEP": {
      log("Update bot step", action.payload)
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
                  const messageUpdate = action.payload.updates as Partial<MessageStepContent>
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
                    } as MessageStepContent
                  }
                  // Update the step as-is, if messages is not part of the update
                  return {
                    ...step,
                    ...action.payload.updates,
                  } as MessageStepContent
                }
                // Update other types of step as-is
                return { ...step, ...action.payload.updates } as StepContent
              })
            }
            : message,
        ),
        pendingUpdate: state.pendingUpdate.includes(action.payload.messageId) ? state.pendingUpdate : [...state.pendingUpdate, action.payload.messageId],
      }
    }

    case "UPDATE_BOT_ACTION": {
      log("Update bot action", action.payload)
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
                      } as TextMessageContent
                    }),
                  }
                  : step,
              ),
            }
            : message,
        ),
        pendingUpdate: state.pendingUpdate.includes(action.payload.messageId) ? state.pendingUpdate : [...state.pendingUpdate, action.payload.messageId],
      }
    }

    case "LOAD_MESSAGES": {
      log(`Load ${action.payload.length} message(s) from persistence`)
      return {
        ...state,
        messages: action.payload,
      }
    }

    case "CLEAR_MESSAGES": {
      return {
        ...state,
        messages: [],
        pendingDelete: state.messages.map((message) => message.id),
      }
    }

    case "CLEAR_PENDING": {
      if (state.pendingUpdate.length > 0) {
        log("Clear pending", state.pendingUpdate)
      }
      if (state.pendingDelete.length > 0) {
        log("Clear pending delete", state.pendingDelete)
      }
      return {
        ...state,
        pendingUpdate: [],
        pendingDelete: [],
      }
    }

    default: {
      return state
    }
  }
}