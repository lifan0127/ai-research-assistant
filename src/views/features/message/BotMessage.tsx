import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
  HandThumbUpIcon as HandThumbUpIconOutline,
  HandThumbDownIcon as HandThumbDownIconOutline,
} from "@heroicons/react/24/outline"
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
  StopIcon,
} from "@heroicons/react/24/solid"
import { findLast } from "lodash"
import {
  Text,
  Message as OpenAIMessage,
  MessageDelta,
  ImageFile,
} from "openai/resources/beta/threads/messages"
import {
  ToolCall,
  ToolCallDelta,
} from "openai/resources/beta/threads/runs/steps"
import { OpenAIError } from "openai/error"
import { anonymizeError } from "../../../models/utils/error"
import { StopRespondingButton } from "../../components/buttons/StopRespondingButton"
import { WidgetProps, Widget } from "../../components/Widget"
import { MessageControl } from "./MessageControl"
import { MessageStep } from "./step/MessageStep"
import { ToolStep, ToolStepInput } from "./step/ToolStep"
import { ErrorStep, ErrorStepInput } from "./step/ErrorStep"
import { Run } from "openai/resources/beta/threads/runs/runs"
import { AssistantStreamEvent } from "openai/resources/beta/assistants"
import { generateMessageId } from "../../../utils/identifiers"
import { BotMessageInput, UserMessageInput } from "../../../typings/messages"
import { UseMessages } from "../../../hooks/useMessages"
import { MessageStepInput } from "../../../typings/steps"

export type BotMessageStatus =
  | "begin"
  | "streaming"
  | "done"
  | "aborted"
  | "error"

type StepInput = MessageStepInput | ToolStepInput | ErrorStepInput

export interface BotMessageControl {
  isCopied: boolean
  setCopyId: (id?: string) => void
  setFunctionCallsCount: (count: number) => void
  addFunctionCallOutput: (tool_call_id: string, output: string) => void
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
  addBotStep: UseMessages["addBotStep"]
  updateBotStep: UseMessages["updateBotStep"]
  addBotAction: UseMessages["addBotAction"]
  updateBotAction: UseMessages["updateBotAction"]
  findLastUserMessage: UseMessages["findLastUserMessage"]
}

interface BotMessageProps {
  input: BotMessageInput
  control: BotMessageControl
}

export function BotMessage({
  input: { id, stream, steps },
  control: {
    setCopyId,
    isCopied,
    setFunctionCallsCount,
    addFunctionCallOutput,
    scrollToEnd,
    pauseScroll,
    resumeScroll,
    addBotStep,
    updateBotStep,
    addBotAction,
    updateBotAction,
    findLastUserMessage,
  },
}: BotMessageProps) {
  // const [vote, setVote] = useState(message.vote)
  const [error, setError] = useState(false)
  const [text, setText] = useState("")
  const [action, setAction] = useState<Omit<WidgetProps, "control">>()
  const [status, setStatus] = useState<BotMessageStatus>("begin")
  const [messageId, setMessageId] = useState<string>()
  const [messageTimestamp, setMessageTimestamp] = useState<string>()
  const ref = useRef<HTMLDivElement>(null)
  // const [steps, setSteps] = useState<StepInput[]>(message.steps || [])

  const lastUserMessage = findLastUserMessage(id)
  const states = lastUserMessage?.states

  // useEffect(() => {
  //   setVote(message.vote)
  // }, [message.vote])

  // useEffect(() => {
  //   if (message.content) {
  //     setText(message.content)
  //     setStatus("done")
  //   }
  // }, [message.content])

  useEffect(() => {
    if (stream?.on) {
      let _steps: (MessageStepInput | ToolStepInput | ErrorStepInput)[] = []
      let _toolCallCount = 0

      const handleMessageCreated = (message: OpenAIMessage) => {
        addBotStep(id, {
          type: "MESSAGE_STEP",
          messages: {
            text: {
              message: "",
              actions: [],
              context: {},
            },
          },
          status: "IN_PROGRESS",
        } as Omit<MessageStepInput, "id" | "timestamp">)
        // _steps = [
        //   {
        //     id: message.id,
        //     type: "MESSAGE_STEP",
        //     timestamp: new Date(message.created_at * 1000).toISOString(),
        //     content: [],
        //     status: "IN_PROGRESS",
        //   },
        // ]
        // _toolCallCount = 0
        // setSteps(_steps)
        setStatus("streaming")
      }

      const handleMessageDelta = (
        _delta: MessageDelta,
        snapshot: OpenAIMessage,
      ) => {
        const currentStep = steps.at(-1) as MessageStepInput
        console.log({ steps, currentStep })
        updateBotStep(id, currentStep.id, {
          messages: [
            {
              type: "TEXT",
              text: {
                message: "test message",
                actions: [],
                context: {},
              },
            },
          ],
        })
        // if (_steps.length === 1) {
        //   _steps = [
        //     {
        //       id: snapshot.id,
        //       type: "MESSAGE_STEP",
        //       timestamp: new Date(snapshot.created_at * 1000).toISOString(),
        //       content: snapshot.content,
        //       status: "IN_PROGRESS",
        //     },
        //   ]
        // } else {
        //   const previousStep = _steps.at(-2) as MessageStepInput | ToolStepInput
        //   _steps = [
        //     ..._steps.slice(0, -2),
        //     { ...previousStep, status: "COMPLETED" },
        //     {
        //       id: snapshot.id,
        //       type: "MESSAGE_STEP",
        //       timestamp: new Date(snapshot.created_at * 1000).toISOString(),
        //       content: snapshot.content,
        //       status: "IN_PROGRESS",
        //     },
        //   ]
        // }
        // setSteps(_steps)
      }

      const handleMessageDone = () => {
        const currentStep = steps.at(-1) as MessageStepInput
        updateBotStep(id, currentStep.id, {
          status: "COMPLETED",
        })
        // const lastStep = _steps.at(-1) as MessageStepInput | ToolStepInput
        // _steps = [
        //   ..._steps.slice(0, -1),
        //   { ...lastStep, status: "COMPLETED" } as any,
        // ]
        // setSteps(_steps)
        setStatus("done")
        // console.log("message done")
        // const { stream, messageSlice, ...messageContent } = message
        // // editMessage({
        // //   ...messageContent,
        // //   status: "done",
        // //   steps: _steps,
        // // })
      }

      const handleTextDone = async (content: Text) => {
        // const { message, actions } = JSON.parse(content.value)
        // setStatus("done")
      }

      const handleImageFileDone = (content: ImageFile) => {
        console.log("imageFileDone", content)
      }

      const handleToolCallDone = (toolCall: ToolCall) => {
        _toolCallCount += 1
        if (_toolCallCount > 5) {
          throw new Error("Too many tool calls")
        }

        switch (toolCall.type) {
          case "function": {
            console.log("toolCallDone - create toolcall step")
            console.log({ toolCall })
            const { name: tool, arguments: toolArguments } = toolCall.function
            _steps = [
              ..._steps,
              {
                id: toolCall.id,
                type: "TOOL_STEP",
                timestamp: new Date().toISOString(),
                tool,
                toolArguments,
                status: "COMPLETED",
              },
            ]
            // setSteps(_steps)
            // setStatus("done")
            break
          }
          default: {
            console.log(`default toolCall: ${toolCall.type}`)
          }
        }
      }

      const handleEvent = ({ event, data }: AssistantStreamEvent) => {
        // switch (event) {
        //   case "thread.run.failed": {
        //     _steps = [
        //       ..._steps,
        //       {
        //         id: generateMessageId(),
        //         type: "ERROR_STEP",
        //         timestamp: new Date().toISOString(),
        //         error: new Error("Thread run failed"),
        //         status: "COMPLETED",
        //       },
        //     ]
        //     _toolCallCount = 0
        //     setSteps(_steps)
        //     setStatus("error")
        //     console.log("thread.run.failed", { event, data })
        //     break
        //   }
        //   case "thread.run.requires_action": {
        //     const requiredAction = data.required_action as Run.RequiredAction
        //     switch (requiredAction.type) {
        //       case "submit_tool_outputs": {
        //         const { tool_calls } = requiredAction.submit_tool_outputs
        //         const functionCalls = tool_calls.filter(
        //           ({ type }) => type === "function",
        //         )
        //         if (functionCalls.length > 0) {
        //           console.log(
        //             `set function calls count: ${functionCalls.length}`,
        //           )
        //           setFunctionCallsCount(functionCalls.length)
        //         }
        //         break
        //       }
        //     }
        //   }
        // }
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
        console.log("end")
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
          .off("run", handleEvent)
          .off("imageFileDone", handleImageFileDone)
          .off("toolCallDone", handleToolCallDone)
          .off("abort", handleAbort)
          .off("error", handleError)
      }
    }
  }, [stream])

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

  if (status === "begin") {
    return (
      <div className="p-[15px]">
        <div className="dot-flashing "></div>
      </div>
    )
  }
  const control = {
    scrollToEnd,
    pauseScroll,
    resumeScroll,
    addFunctionCallOutput,
    save: saveMessageStep,
  }
  return (
    <div className="relative self-start w-auto max-w-full sm:max-w-[85%] my-2 pb-2">
      {steps.map((step) => {
        switch (step.type) {
          case "MESSAGE_STEP": {
            return (
              <div
                ref={ref}
                className="bg-white p-2 border border-neutral-500 rounded shadow-md text-black break-words"
              >
                {/* <MessageStep input={step} control={control} /> */}
                <pre>{JSON.stringify(step, null, 2)}</pre>
                <div className="flex pt-3">
                  {status === "streaming" ? (
                    <div className="flex-none flex space-x-2">
                      <StopRespondingButton
                        name="STOP_RESPONDING"
                        status={status}
                        utils={{ stopResponding }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex-none flex space-x-2">
                        <MessageControl
                          {...message}
                          copyId={copyId}
                          setCopyId={setCopyId}
                          states={states}
                        />
                      </div>
                      <div className="flex-auto"></div>
                      <div className="flex-none flex flex-col">
                        <div className="self-end">
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
                        </div>
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
            return <ToolStep input={step} control={control} />
          }
          case "ERROR_STEP": {
            return (
              <div
                ref={ref}
                className="bg-white p-2 border border-neutral-500 rounded shadow-md text-black break-words"
              >
                <ErrorStep input={step} control={control} />
              </div>
            )
          }
        }
      })}
    </div>
  )
}
