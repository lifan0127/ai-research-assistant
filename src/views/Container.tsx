import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  createContext,
  useContext,
  useCallback,
} from "react"
import { useMessages, ConversationInfo } from "../hooks/useMessages"
import { useDragging } from "../hooks/useDragging"
import { TestMenu } from "./features/menus/TestMenu"
import { ResearchAssistant } from "../models/assistant"
import {
  ClarificationActionResponse,
  ErrorActionResponse,
  ExecutorActionResponse,
} from "../models/utils/actions"
import {
  UserMessage,
  UserMessageControl,
} from "./features/messages/UserMessage"
import { BotMessage, BotMessageControl } from "./features/messages/BotMessage"
import { Header } from "./features/Header"
import { MainMenu } from "./features/menus/MainMenu"
import { Input } from "./features/input/Input"
import { Version } from "./components/Version"
import "./style.css"
import { areStatesEmpty, simplifyStates } from "../models/utils/states"
import { UserInput } from "../typings/input"
import { Feedback } from "./features/Feedback"
import { useFeedback } from "../hooks/useFeedback"
import { InfoPanel } from "./features/infoPanel/InfoPanel"
import { PromptLibrary } from "./features/infoPanel/PromptLibrary"
import { FAQ } from "./features/infoPanel/FAQ"
import { config } from "../../package.json"
import { getPref, setPref } from "../utils/prefs"
import { debounce, set } from "lodash"
import { useZoom } from "../hooks/useZoom"
import { useNotification } from "../hooks/useNotification"
import { useAssistant } from "../hooks/useAssistant"
import { useScroll } from "../hooks/useScroll"
import { AssistantStream } from "openai/lib/AssistantStream"
import { useFunctionCalls } from "../hooks/useFunctionCalls"
import { recursiveSearchAndCompileResults } from "../apis/zotero/search"
import { SearchStrategy } from "./components/search/SearchStrategy"
import { FilePreparation } from "./components/files/FirePreparation"
import { getItemsAndIndexAttachments } from "../apis/zotero/item"
import { FileUploader } from "./components/files/FileUploader"
import { FileIndexer } from "./components/files/FileIndexer"
import { FileRetriever } from "./components/files/FileRetriever"

export function log(...messages: any) {
  if (__env__ === "development") {
    ztoolkit.log("[aria/ui container]", ...messages)
  }
}

export function Container() {
  const [currentConversation, setCurrentConversation] = useState(
    JSON.parse(getPref("CURRENT_CONVERSATION") as string) as ConversationInfo,
  )
  const zoom = useZoom()
  const { notification, hasNotification } = useNotification()
  const [input, setInput] = useState<{ userInput: UserInput; id?: string }>()
  const { isDragging, setIsDragging } = useDragging()
  const {
    messages,
    getMessage,
    addUserMessage,
    addBotMessage,
    updateUserMessage,
    getBotStep,
    addBotStep,
    updateBotStep,
    completeBotMessageStep,
    updateBotAction,
    clearMessages,
    findLastUserMessage,
  } = useMessages(currentConversation)
  const { submitFeedback, openFeedback, setOpenFeedback, submitCallback } =
    useFeedback()
  const [promptTemplate, setPromptTemplate] = useState<
    { template: string } | undefined
  >()
  const [isLoading, setIsLoading] = useState(false)
  // Keep track of the last copied message
  const [copyId, setCopyId] = useState<string>()
  // Keep track of the last edited user message
  const [editId, setEditId] = useState<string | undefined>()
  const containerRef = useRef<HTMLDivElement>(null)
  const { assistant } = useAssistant()
  const {
    functionCalls,
    functionCallsFulfilled,
    setFunctionCalls,
    setFunctionCallsCount,
    addFunctionCallOutput,
    clearFunctionCalls,
  } = useFunctionCalls()
  const { scrollToEnd, pauseScroll, resumeScroll } = useScroll(containerRef)

  useEffect(() => {
    // scrollToEnd()
  }, [])

  useEffect(() => {
    assistant.setThread(currentConversation.metadata.threadId)
    assistant.setVectorStore(currentConversation.metadata.vectorStoreId)
  }, [currentConversation])

  useEffect(() => {
    if (functionCallsFulfilled()) {
      const stream = assistant.streamTools(functionCalls)
      clearFunctionCalls()
      addBotMessage({
        conversationId: currentConversation.id,
        stream: stream,
        steps: [],
      })
    }
  }, [functionCalls, functionCallsFulfilled, clearFunctionCalls])

  // useEffect(() => {
  //   function handleAction(
  //     {
  //       action,
  //       payload,
  //     }:
  //       | ClarificationActionResponse
  //       | ErrorActionResponse
  //       | ExecutorActionResponse,
  //     isSubscribed: boolean,
  //   ) {
  //     if (!isSubscribed) {
  //       return
  //     }
  //     switch (action) {
  //       case "clarification": {
  //         const { message, _raw } = payload
  //         const newBotMessage = {
  //           type: "BOT_MESSAGE" as const,
  //           widget: "MARKDOWN" as const,
  //           input: {
  //             content: message,
  //           },
  //           _raw,
  //         }
  //         return addMessage(newBotMessage)
  //       }
  //       case "error": {
  //         const { error, _raw } = payload
  //         const newBotMessage = {
  //           type: "BOT_MESSAGE" as const,
  //           widget: "ERROR" as const,
  //           input: {
  //             error,
  //           },
  //           _raw,
  //         }
  //         return addBotMessage(newBotMessage)
  //       }
  //       default: {
  //         const { widget, input, _raw } = payload
  //         const newBotMessage = {
  //           type: "BOT_MESSAGE" as const,
  //           widget,
  //           input: input as LegacyBotMessageProps["input"],
  //           _raw,
  //         }
  //         return addBotMessage(newBotMessage)
  //       }
  //     }
  //   }
  //   let isSubscribed = true
  //   if (userInput) {
  //     const stream = assistant.stream(
  //       userInput.content.newValue,
  //       userInput.states,
  //     )
  //     initMessage({
  //       type: "BOT_STREAM_MESSAGE",
  //       stream: stream,
  //       messageSlice: messages,
  //       scrollToEnd: scrollToEnd,
  //       persistMessage,
  //     })
  //   }
  //   return () => {
  //     isSubscribed = false
  //   }
  // }, [userInput])

  useEffect(() => {
    if (input) {
      const { userInput, id } = input
      if (id) {
        // const updatedUserMessage = {
        //   type: "USER_MESSAGE" as const,
        //   id,
        //   ...input,
        // }
        // legacyAssistant.rebuildMemory(updateMessage(updatedUserMessage))
      } else {
        addUserMessage(userInput)
      }
      const stream = assistant.streamMessage(
        userInput.content.newValue,
        simplifyStates(userInput.states),
      )
      addBotMessage({
        stream: stream,
        steps: [],
      })
    }
  }, [addUserMessage, addBotMessage, assistant, input])

  const handleSubmit = useCallback(
    async (userInput: UserInput, id?: string) => {
      setInput({ userInput, id })
      // scrollToEnd()
      // if (id) {
      //   const updatedUserMessage = {
      //     type: "USER_MESSAGE" as const,
      //     id,
      //     content,
      //     states,
      //   }
      //   // legacyAssistant.rebuildMemory(updateMessage(updatedUserMessage))
      //   setUserInput({ content, states })
      // } else {
      //   const newUserMessage = {
      //     type: "USER_MESSAGE" as const,
      //     content,
      //     states,
      //   }

      //   addMessage(newUserMessage)

      //   if (isLoading) {
      //     // If either the older or the newer message has empty states (and therefore mentions), their text contents are merged and the non-empty states/mentions are kept. Otherwise the older message is discarded.
      //     if (!userInput?.states || areStatesEmpty(userInput.states)) {
      //       const previousValue = userInput?.content
      //         ? userInput.content.newValue + "\n"
      //         : ""
      //       const previousPlainTextValue = userInput?.content
      //         ? userInput.content.newPlainTextValue + "\n"
      //         : ""
      //       const mergedContent = {
      //         newValue: previousValue + content.newValue,
      //         newPlainTextValue:
      //           previousPlainTextValue + content.newPlainTextValue,
      //         mentions: content.mentions.map((mention) => ({
      //           ...mention,
      //           index: mention.index + previousValue.length + 1,
      //           plainTextIndex:
      //             mention.plainTextIndex + previousPlainTextValue.length + 1,
      //         })),
      //       }
      //       setUserInput({ content: mergedContent, states })
      //     } else if (areStatesEmpty(states)) {
      //       const mergedContent = {
      //         newValue: userInput.content.newValue + "\n" + content.newValue,
      //         newPlainTextValue:
      //           userInput.content.newPlainTextValue +
      //           "\n" +
      //           content.newPlainTextValue,
      //         mentions: userInput.content.mentions,
      //       }
      //       setUserInput({ content: mergedContent, states: userInput.states })
      //     } else {
      //       setUserInput({ content, states })
      //     }
      //   } else {
      //     setUserInput({ content, states })
      //   }
      // }
    },
    [setInput],
  )

  const [testData, setTestData] = useState<any>()

  async function handleTest() {
    // const vectorStoreId = getPref("CURRENT_VECTORSTORE")
    // console.log({ form: new FormData(), type: typeof FormData })
    // const item = await Zotero.Items.getAsync(120)
    // console.log("item", item.getDisplayTitle())
    // const attachment = (await item.getBestAttachment()) as Zotero.Item
    // console.log("attachment file name", attachment.attachmentFilename)
    // const fileId = await assistant.uploadFile(item, attachment, "assistants")
    // await assistant.indexFile(item, fileId, vectorStoreId)
    // console.log("item", ztoolkit.ExtraField.getExtraFields(item))
    // const stream = assistant.streamQA("How to use LLM for taxonomy building?")
    // stream.on("messageDelta", (_delta: any, snapshot: any) => {
    //   console.log("messageDelta", snapshot.content[0].text)
    // })
    // const itemIds = [703, 709, 783, 786, 981, 1017, 1202]
    // itemIds.forEach((id) => {
    //   const item = Zotero.Items.get(id)
    //   const updatedFields = new Map()
    //   Object.entries(ztoolkit.ExtraField.getExtraFields(item)).forEach(
    //     ([key, value]) => {
    //       if (key !== "aria.file") {
    //         updatedFields.set(key, value)
    //       }
    //     },
    //   )
    //   ztoolkit.ExtraField.replaceExtraFields(item, updatedFields)
    // })
    // const results = await getItemsAndIndexAttachments(
    //   itemIds,
    //   assistant.currentVectorStore!,
    // )
    // setTestData(results)
    setTestData({
      itemIds: [703, 709, 783, 786, 981, 1017, 1202],
      query: {
        boolean: "OR",
        subqueries: [
          {
            conditions: [
              {
                condition: "creator",
                operator: "contains",
                value: "Andrew White",
              },
            ],
            match: "all",
            title: "Papers by Andrew White",
          },
          {
            conditions: [
              {
                condition: "creator",
                operator: "contains",
                value: "Andrew D. White",
              },
            ],
            match: "all",
            title: "Papers by Andrew D. White",
          },
        ],
      },
    })
    // const uploadFiles = results.filter(({ file }) => !file)
    // const indexFiles = results.filter(({ file, index }) => !!file && !index)
    // setTestData({ uploadFile: uploadFiles, indexFile: indexFiles })
    // console.log({ uploadFile: uploadFiles, indexFile: indexFiles })
  }

  const userMessageControl: Omit<UserMessageControl, "isCopied" | "isEditing"> =
    useMemo(
      () => ({
        setCopyId,
        setEditId,
        setPromptTemplate,
        onSubmit: handleSubmit,
      }),
      [setCopyId, setEditId, setPromptTemplate, handleSubmit],
    )

  const botMessageControl: Omit<BotMessageControl, "isCopied"> = useMemo(
    () => ({
      setCopyId,
      setFunctionCallsCount,
      addFunctionCallOutput,
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      getMessage,
      addUserMessage,
      addBotMessage,
      getBotStep,
      addBotStep,
      updateBotStep,
      completeBotMessageStep,
      updateBotAction,
      findLastUserMessage,
    }),
    [
      setCopyId,
      setFunctionCallsCount,
      addFunctionCallOutput,
      scrollToEnd,
      pauseScroll,
      resumeScroll,
      getMessage,
      addUserMessage,
      addBotMessage,
      getBotStep,
      addBotStep,
      updateBotStep,
      completeBotMessageStep,
      updateBotAction,
      findLastUserMessage,
    ],
  )

  return (
    <div
      className="fixed m-0 h-full px-3 bg-gradient-170 from-red-50 to-blue-50 flex flex-col"
      style={zoom.style}
      onDragEnter={() => setIsDragging(isDragging + 1)}
      onDragLeave={() => setIsDragging(isDragging - 1)}
    >
      {notification}
      <Header containerRef={containerRef}>
        {__env__ === "development" ? (
          <TestMenu
            setInput={setInput}
            addMessage={addUserMessage}
            hasNotification={hasNotification}
          />
        ) : null}
        <MainMenu
          containerRef={containerRef}
          resetMemory={assistant.resetMemory}
          messages={messages}
          clearMessages={clearMessages}
          zoom={zoom}
          hasNotification={hasNotification}
        />
      </Header>
      <div
        className={`w-full flex-auto mb-4 overflow-x-hidden overflow-y-scroll flex flex-col justify-start`}
        ref={containerRef}
        style={{
          background:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 100%)",
        }}
      >
        <InfoPanel
          promptLibrary={
            <PromptLibrary setPromptTemplate={setPromptTemplate} />
          }
          faq={<FAQ />}
        />
        {/* <button onClick={handleTest}>Test File Indexer</button> */}
        <div className="relative self-start w-full sm:max-w-[85%] my-2 pb-2">
          {testData ? (
            // <FileUploader
            //   onUpdate={(status) => log("File uploading status", status)}
            //   onComplete={(files) => log("File uploading complete", files)}
            //   files={testData?.uploadFile}
            // />
            // <FileIndexer
            //   onComplete={(files) => log("File indexing complete", files)}
            //   files={testData?.indexFile}
            // />
            // <FilePreparation
            //   files={testData}
            //   onComplete={() => log("File preparation complete")}
            //   pauseScroll={pauseScroll}
            // />
            <FileRetriever
              itemIds={testData.itemIds}
              query={testData.query}
              onComplete={(files) =>
                console.log("File retrieval complete", files)
              }
            />
          ) : null}
        </div>
        {messages.map((message, index) => {
          switch (message.type) {
            case "USER_MESSAGE": {
              return (
                <UserMessage
                  key={message.id}
                  content={message}
                  control={userMessageControl}
                  isCopied={copyId === message.id}
                  isEditing={editId === message.id}
                />
              )
            }
            case "BOT_MESSAGE": {
              // return <pre>{JSON.stringify(message, null, 2)}</pre>
              return (
                <BotMessage
                  key={message.id}
                  content={message}
                  control={botMessageControl}
                  isCopied={copyId === message.id}
                />
              )
            }
          }
        })}
      </div>
      <div className="flex-initial">
        {/* {isLoading ? (
          <div className="absolute right-10 pt-4 z-10">
            <div className="dot-flashing "></div>
          </div>
        ) : null} */}
        <div className="bottom-6 w-full z-40 m-0 mb-4">
          <Input
            disabled={editId !== undefined}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            promptTemplate={promptTemplate}
            setPromptTemplate={setPromptTemplate}
          />
        </div>
        {/* <Version /> */}
      </div>
      <Feedback
        open={openFeedback}
        setOpen={setOpenFeedback}
        callback={submitCallback}
      />
    </div>
  )
}
