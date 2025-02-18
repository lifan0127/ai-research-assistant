import {
  UserMessageContent,
  BotMessageContent,
  MessageStore
} from "../typings/messages"
import { MessageStepContent, StepContent, TextMessageContent, ActionStepContent, WorkflowStepContent } from "../typings/steps"
import { MessageContent } from "../typings/messages"
import { generateStepId, generateActionId } from "../utils/identifiers"
import { ActionType } from "../typings/actions"
import { ResearchAssistant } from "../models/assistant"
import { store as log } from "../utils/loggers"
import { generateTimestamp } from "../utils/datetime"
import { parsePartialJson } from "../utils/parsers"

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
      updates: Partial<Omit<StepContent, "id">>
    }
  }
  | {
    type: "COMPLETE_BOT_MESSAGE_STEP"
    payload: {
      messageId: string
      stepId: string
    }
  }
  | {
    type: "ADD_BOT_ACTIONS"
    payload: { messageId: string; stepId: string; actions: ActionType[] }
  }
  | {
    type: "UPDATE_BOT_ACTION"
    payload: {
      messageId: string
      stepId: string
      actionId: string
      updates: Partial<ActionType>
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
                const { params, ...rest } = action.payload.updates
                const newParams = params ? { ...step.params, ...params } : step.params
                return { ...step, ...rest, params: newParams } as StepContent
              })
            }
            : message,
        ),
        pendingUpdate: state.pendingUpdate.includes(action.payload.messageId) ? state.pendingUpdate : [...state.pendingUpdate, action.payload.messageId],
      }
    }

    case "COMPLETE_BOT_MESSAGE_STEP": {
      const { messageId, stepId } = action.payload
      const currentMessage = state.messages.find(({ id }) => id === messageId) as BotMessageContent
      const currentStep = currentMessage!.steps.find(({ id }) => id === stepId) as MessageStepContent
      const parsedMessages = currentStep.params.messages.map((message) => {
        switch (message.type) {
          case "TEXT": {
            const parsed = parsePartialJson(message.params.raw!.value)
            return {
              ...message,
              params: {
                message: parsed.message,
                context: parsed.context || {},
                workflows: parsed.workflows || [],
              },
            }
          }
          default: {
            return message
          }
        }
      })
      const workflowSteps = parsedMessages.filter((message) => message.type === "TEXT" && message.params.workflows.length > 0).map((message) => {
        const { params } = message as TextMessageContent
        return params.workflows!.map((workflow) => {
          return {
            id: generateStepId(),
            messageId,
            timestamp: generateTimestamp(),
            type: "WORKFLOW_STEP",
            status: "IN_PROGRESS",
            // status: "COMPLETED", // For now, we set the workflow to completed for development
            params: {
              workflow,
              context: params.context,
            }
          }
        })
      }).flat() as WorkflowStepContent[]

      return {
        ...state,
        messages: state.messages.map((message) =>
          message.type === "BOT_MESSAGE" &&
            message.id === action.payload.messageId
            ? {
              ...message,
              steps: [...message.steps.map((step) => {
                if (step.id !== action.payload.stepId) {
                  return step
                }
                return {
                  ...step,
                  params: {
                    messages: parsedMessages
                  },
                  status: "COMPLETED",
                } as StepContent
              }), ...workflowSteps]
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
                    params: step.params.messages.map((message) => {
                      if (message.type !== "TEXT") {
                        return message
                      }
                      return {
                        ...message,
                        params: {
                          ...message.params,
                          actions: message.params.actions!.map((act) =>
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