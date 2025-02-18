import React, { useState, useEffect, useRef, useMemo, memo } from "react"
import {
  HandThumbUpIcon as HandThumbUpIconOutline,
  HandThumbDownIcon as HandThumbDownIconOutline,
} from "@heroicons/react/24/outline"
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
  StopIcon,
} from "@heroicons/react/24/solid"
import {
  Text,
  Message as OpenAIMessage,
  MessageDelta,
  ImageFile,
} from "openai/resources/beta/threads/messages"
import {
  FunctionToolCall,
  ToolCall,
} from "openai/resources/beta/threads/runs/steps"
import { OpenAIError } from "openai/error"
import { anonymizeError } from "../../../models/utils/error"
import { StopRespondingButton } from "../../components/buttons/StopRespondingButton"
import { MessageControl } from "./MessageControl"
import { MessageStep } from "./steps/MessageStep"
import { ToolStep } from "./steps/ToolStep"
import { ErrorStep } from "./steps/ErrorStep"
import { Run } from "openai/resources/beta/threads/runs/runs"
import { AssistantStreamEvent } from "openai/resources/beta/assistants"
import { generateMessageId } from "../../../utils/identifiers"
import {
  BotMessageContent,
  UserMessageContent,
} from "../../../typings/messages"
import { UseMessages } from "../../../hooks/useMessages"
import {
  MessageStepContent,
  ToolStepContent,
  ActionStepContent,
  ErrorStepContent,
  TextMessageContent,
} from "../../../typings/steps"
import { serializeError } from "serialize-error"
import { CodeHighlighter } from "../../components/code/CodeHighlighter"
import { message as log } from "../../../utils/loggers"
import { update } from "lodash"
import { RoutingOutputWorkflow } from "../../../models/schemas/routing"
import { ActionType } from "../../../typings/actions"
import { ActionStep } from "./steps/ActionStep"
import { WorkflowStep } from "./steps/WorkflowStep"

// type StepInput = MessageStepContent | ToolStepContent | ErrorStepContent

export interface BotMessageControl {
  setCopyId: (id?: string) => void
  setFunctionCallsCount: (count: number) => void
  addFunctionCallOutput: (tool_call_id: string, output: string) => void
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
  getMessage: UseMessages["getMessage"]
  addUserMessage: UseMessages["addUserMessage"]
  addBotMessage: UseMessages["addBotMessage"]
  getBotStep: UseMessages["getBotStep"]
  addBotStep: UseMessages["addBotStep"]
  updateBotStep: UseMessages["updateBotStep"]
  completeBotMessageStep: UseMessages["completeBotMessageStep"]
  updateBotAction: UseMessages["updateBotAction"]
  findLastUserMessage: UseMessages["findLastUserMessage"]
}

interface BotMessageProps {
  content: BotMessageContent
  control: BotMessageControl
  isCopied: boolean
}

export const BotMessage = memo(function BotMessageContent({
  content: { id, stream, steps },
  control: {
    setCopyId,
    setFunctionCallsCount,
    addFunctionCallOutput,
    scrollToEnd,
    pauseScroll,
    resumeScroll,
    addUserMessage,
    addBotMessage,
    getMessage,
    getBotStep,
    addBotStep,
    updateBotStep,
    completeBotMessageStep,
    updateBotAction,
    findLastUserMessage,
  },
  isCopied,
}: BotMessageProps) {
  log("Render bot message", id, { stream, steps }, getMessage(id))
  // const [vote, setVote] = useState(message.vote)
  const currentStepIdRef = useRef<string | undefined>()
  const toolCallCountRef = useRef(0)
  const [error, setError] = useState(false)
  const [text, setText] = useState("")
  const [messageId, setMessageId] = useState<string>()
  const [messageTimestamp, setMessageTimestamp] = useState<string>()
  const ref = useRef<HTMLDivElement>(null)
  // const [steps, setSteps] = useState<StepInput[]>(message.steps || [])
  const [unresponsive, setUnresponsive] = useState(false)
  const lastUserMessage = findLastUserMessage(id)
  const states = lastUserMessage?.states

  // useEffect(() => {
  //   setVote(message.vote)
  // }, [message.vote])

  // useEffect(() => {
  //   if (message.content) {
  //     setText(message.content)
  //   }
  // }, [message.content])

  // useEffect(() => {
  //   stepsRef.current = steps
  // }, [steps])

  useEffect(() => {
    if (stream?.on) {
      const handleMessageCreated = async (message: OpenAIMessage) => {
        log("Bot message created", id)
        const stepId = await addBotStep(id, {
          type: "MESSAGE_STEP",
          params: [],
          status: "IN_PROGRESS",
        } as Omit<MessageStepContent, "id" | "messageId" | "timestamp">)
        currentStepIdRef.current = stepId
      }

      const handleMessageDelta = (
        _delta: MessageDelta,
        snapshot: OpenAIMessage,
      ) => {
        const currentStepId = currentStepIdRef.current as string
        log(
          "Bot message delta",
          id,
          currentStepId,
          JSON.stringify(snapshot.content),
        )
        updateBotStep(id, currentStepId, {
          params: {
            messages: snapshot.content.map((message) => {
              switch (message.type) {
                case "text": {
                  return {
                    type: "TEXT" as const,
                    params: {
                      raw: message.text,
                    },
                  }
                }
                default: {
                  throw new Error("Not implemented")
                }
              }
            }),
          },
        } as Partial<MessageStepContent> & Pick<MessageStepContent, "type">)
      }

      const handleMessageDone = () => {
        log("Bot message done", id, currentStepIdRef.current)
        completeBotMessageStep(id, currentStepIdRef.current as string)
      }

      const handleTextDone = async (content: Text) => {}

      const handleImageFileDone = (content: ImageFile) => {
        console.log("imageFileDone", content)
      }

      const handleToolCallDone = async (toolCall: ToolCall) => {
        toolCallCountRef.current += 1
        if (toolCallCountRef.current > 5) {
          throw new Error("Too many tool calls")
        }

        switch (toolCall.type) {
          case "function": {
            const { name, arguments: parameters } =
              toolCall.function as FunctionToolCall["function"]
            await addBotStep(id, {
              type: "TOOL_STEP",
              params: {
                id: toolCall.id,
                name,
                parameters: JSON.parse(parameters),
              },
              status: "IN_PROGRESS",
            } as Omit<ToolStepContent, "id" | "timestamp">)
            // setSteps(_steps)
            break
          }
          default: {
            console.log(`default toolCall: ${toolCall.type}`)
          }
        }
      }

      const handleEvent = async ({ event, data }: AssistantStreamEvent) => {
        switch (event) {
          case "thread.run.failed": {
            await addBotStep(id, {
              type: "ERROR_STEP",
              params: {
                message: "Thread run failed",
                stack: serializeError(data),
              },
              status: "COMPLETED",
            } as Omit<ErrorStepContent, "id" | "timestamp">)
            toolCallCountRef.current = 0
            console.log("thread.run.failed", { event, data })
            break
          }
          case "thread.run.requires_action": {
            const requiredAction = data.required_action as Run.RequiredAction
            switch (requiredAction.type) {
              case "submit_tool_outputs": {
                const { tool_calls } = requiredAction.submit_tool_outputs
                const functionCalls = tool_calls.filter(
                  ({ type }) => type === "function",
                )
                if (functionCalls.length > 0) {
                  setFunctionCallsCount(functionCalls.length)
                }
                break
              }
            }
          }
        }
      }

      const handleAbort = () => {
        // persistMessage({
        //   id: messageId as string,
        //   timestamp: messageTimestamp as string,
        //   type: "BOT_MESSAGE",
        //   content: text,
        // } as any)
        // setStatus("aborted")
      }

      const handleError = (error: OpenAIError) => {
        // console.log("Error", { error })
        // _steps = [
        //   ..._steps,
        //   {
        //     id: generateMessageId(),
        //     type: "ERROR_STEP",
        //     timestamp: new Date().toISOString(),
        //     error: error,
        //     status: "COMPLETED",
        //   },
        // ]
        // setSteps(_steps)
        // setStatus("done")
      }

      const handleEnd = () => {
        console.log("stream end")
      }

      stream
        .on("messageCreated", handleMessageCreated)
        .on("messageDelta", handleMessageDelta)
        .on("messageDone", handleMessageDone)
        .on("textDone", handleTextDone)
        .on("imageFileDone", handleImageFileDone)
        .on("toolCallDone", handleToolCallDone)
        .on("event", handleEvent)
        .on("abort", handleAbort)
        .on("error", handleError)
        .on("end", handleEnd)

      return () => {
        stream
          .off("messageCreated", handleMessageCreated)
          .off("messageDelta", handleMessageDelta)
          .off("messageDone", handleMessageDone)
          .off("textDone", handleTextDone)
          .off("imageFileDone", handleImageFileDone)
          .off("toolCallDone", handleToolCallDone)
          .off("event", handleEvent)
          .off("abort", handleAbort)
          .off("error", handleError)
          .off("end", handleEnd)
      }
    }
  }, [stream])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (steps.length === 0) {
        setUnresponsive(true)
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [steps])

  function saveMessageStep(stepContent: any) {
    console.log({ stepContent })
    const { stream, messageSlice, ...messageContent } = message
    editMessage({
      ...messageContent,
      status: "done",
      steps: [stepContent],
    })
  }

  function handleVote(vote: "up" | "down") {
    const { id, timestamp } = message
    const serializedMessages = JSON.stringify(
      messageSlice.map((message) => {
        const input = (message as BotMessageProps).content

        if (message.type === "BOT_MESSAGE" && message.error) {
          if (message.error.stack && typeof message.error.stack === "string") {
            message.error.stack = anonymizeError(message.error.stack)
          }
        }
        let purgedStates
        if (
          message.type === "USER_MESSAGE" &&
          message.states.images.length > 0
        ) {
          const states = (message as UserMessageProps).states
          purgedStates = {
            ...states,
            images: states.images.map(({ image, ...rest }) => ({
              ...rest,
              image: image.slice(0, 64) + "...",
            })),
          }
        }
        return {
          id: message.id,
          timestamp: message.timestamp,
          type: message.type,
          content: (message as UserMessageProps).content,
          states: purgedStates,
          input,
        }
      }),
    )

    submitFeedback(
      {
        id,
        timestamp,
        vote,
        user: null,
        messages: serializedMessages,
        env: __env__,
      },
      (vote: "up" | "down") =>
        editMessage({
          ...message,
          type: "BOT_MESSAGE",
          vote,
        }),
      (success: boolean) => {
        if (success) {
          setVote(vote)
          setError(false)
        } else {
          setError(true)
        }
      },
    )
  }

  function stopResponding() {
    stream?.abort()
  }

  const messageStepControl = useMemo(
    () => ({
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      updateBotAction,
      getBotStep,
    }),
    [scrollToEnd, pauseScroll, resumeScroll, updateBotAction, getBotStep],
  )

  const toolStepControl = useMemo(
    () => ({
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      updateBotStep,
      addFunctionCallOutput,
    }),
    [
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      updateBotStep,
      addFunctionCallOutput,
    ],
  )

  const actionStepControl = useMemo(
    () => ({
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      addUserMessage,
      addBotMessage,
      getBotStep,
      addBotStep,
      updateBotStep,
      addFunctionCallOutput,
    }),
    [
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      addUserMessage,
      addBotMessage,
      getBotStep,
      addBotStep,
      updateBotStep,
      addFunctionCallOutput,
    ],
  )

  const workflowStepControl = useMemo(
    () => ({
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      getBotStep,
      addBotStep,
      updateBotStep,
      addFunctionCallOutput,
    }),
    [
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      getBotStep,
      addBotStep,
      updateBotStep,
      addFunctionCallOutput,
    ],
  )

  const errorStepControl = useMemo(
    () => ({
      scrollToEnd,
      pauseScroll,
      resumeScroll,
    }),
    [scrollToEnd, pauseScroll, resumeScroll],
  )

  if (steps.length === 0) {
    return (
      <div className="p-[15px]">
        {unresponsive ? (
          <div>
            <div>
              Sorry, I am experiencing some connectivity issues. Please wait a
              little longer or try again later.
            </div>
            <div className="dot-flashing "></div>
          </div>
        ) : (
          <div className="p-[15px]">
            <div className="dot-flashing "></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative self-start w-auto max-w-full sm:max-w-[85%] pb-2">
      {steps.map((step) => {
        // return <CodeHighlighter code={JSON.stringify(step)} language="json" />
        switch (step.type) {
          case "MESSAGE_STEP": {
            return (
              <div
                ref={ref}
                className="bg-white p-2 border border-neutral-500 rounded shadow-md text-black break-words my-2"
              >
                <MessageStep content={step} control={messageStepControl} />
                <div className="flex pt-3">
                  {step.status === "IN_PROGRESS" ? (
                    <div className="flex-none flex space-x-2">
                      <StopRespondingButton
                        name="STOP_RESPONDING"
                        status={step.status}
                        utils={{ stopResponding }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* <div className="flex-none flex space-x-2">
                        <MessageControl
                          {...message}
                          copyId={copyId}
                          setCopyId={setCopyId}
                          states={states}
                        />
                      </div> */}
                      <div className="flex-auto"></div>
                      <div className="flex-none flex flex-col">
                        {/* <div className="self-end">
                          <button
                            type="button"
                            className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none px-2 py-1"
                            aria-label="ThumbUp"
                            onClick={() => handleVote("up")}
                          >
                            {vote === "up" ? (
                              <HandThumbUpIconSolid
                                className="w-5 h-5 text-tomato"
                                aria-hidden="true"
                              />
                            ) : (
                              <HandThumbUpIconOutline
                                className="w-5 h-5 text-neutral-500"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                          <button
                            type="button"
                            className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none px-2 py-1"
                            aria-label="ThumbDown"
                            onClick={() => handleVote("down")}
                          >
                            {vote === "down" ? (
                              <HandThumbDownIconSolid
                                className="w-5 h-5 text-tomato"
                                aria-hidden="true"
                              />
                            ) : (
                              <HandThumbDownIconOutline
                                className="w-5 h-5 text-neutral-500"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </div> */}
                        {error ? (
                          <div className="text-xs text-red-500">
                            Failed to submit feedback
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          }
          case "TOOL_STEP": {
            return <ToolStep content={step} control={toolStepControl} />
          }
          case "WORKFLOW_STEP": {
            return <WorkflowStep content={step} control={workflowStepControl} />
          }
          case "ACTION_STEP": {
            return <ActionStep content={step} control={actionStepControl} />
          }
          case "ERROR_STEP": {
            return (
              <div
                ref={ref}
                className="bg-white p-2 border border-neutral-500 rounded shadow-md text-black break-words"
              >
                <ErrorStep content={step} control={errorStepControl} />
              </div>
            )
          }
        }
      })}
    </div>
  )
})
