import React, { useState, useEffect, useRef, memo } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid"
import { CSSTransition } from "react-transition-group"
import { FileUploader } from "../../../components/files/FileUploader"
import { FileIndexer } from "../../../components/files/FileIndexer"
import { FileStatus } from "../../../components/files/FileStatus"
import {
  FileForIndexing,
  FilePreparationStatus,
} from "../../../../typings/files"
import { OpenAIIcon } from "../../../icons/openai"
import { FileActionStepContent } from "../../../../typings/steps"
import { FileActionStepControl } from "../../../../typings/actions"
import { FileActionType } from "../../../../typings/actions"
import { action as log } from "../../../../utils/loggers"
import { SearchActionStepContent } from "../../../../typings/steps"
import { getItemsAndIndexAttachments } from "../../../../apis/zotero/item"
import { useAssistant } from "../../../../hooks/useAssistant"

interface FileActionProps {
  content: FileActionStepContent
  control: FileActionStepControl
}

export const FileAction = memo(function FileActionComponent({
  content: { messageId, id, status, params },
  control: {
    scrollToEnd,
    pauseScroll,
    getBotStep,
    addBotStep,
    updateBotStep,
    completeBotMessageStep,
  },
}: FileActionProps) {
  const { assistant } = useAssistant()
  const {
    action: {
      input: { searchResultsStepId },
      output,
    },
    workflow,
  } = params

  const [uploadFiles, setUploadFiles] = useState<FileForIndexing[]>([])
  const [indexFiles, setIndexFiles] = useState<FileForIndexing[]>([])
  const [uploadComplete, setUploadComplete] = useState(uploadFiles.length === 0)
  const [indexComplete, setIndexComplete] = useState(
    uploadFiles.length === 0 && indexFiles.length === 0,
  )
  const [uploadExpanded, setUploadExpanded] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<FilePreparationStatus[]>()
  const [indexExpanded, setIndexExpanded] = useState(false)
  const [indexStatus, setIndexStatus] = useState<FilePreparationStatus[]>()
  const uploadRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchSearchResults() {
      const searchResultsBotStep = getBotStep(
        messageId,
        searchResultsStepId,
      ) as SearchActionStepContent
      const itemIds = searchResultsBotStep.params.action.output.results
      log("Search result item IDs", { itemIds })
      const files = await getItemsAndIndexAttachments(
        itemIds,
        assistant.currentVectorStore!,
      )
      setUploadFiles(
        files.filter(({ attachment, file }) => attachment && !file),
      )
      setIndexFiles(files.filter(({ file, index }) => file && !index))
    }
    if (status !== "COMPLETED") {
      fetchSearchResults()
    }
  }, [searchResultsStepId])

  useEffect(() => {
    if (uploadComplete && indexComplete) {
      log("FileAction complete", { messageId, id })
      updateBotStep(messageId, id, {
        status: "COMPLETED",
      })
      updateBotStep(messageId, workflow.stepId, {
        type: "WORKFLOW_STEP",
        params: {
          indexed: true,
        },
      })
    }
  }, [uploadComplete, indexComplete])

  function handleClick(
    event: React.MouseEvent,
    expanded: boolean,
    setExpanded: (value: boolean) => void,
  ) {
    event.preventDefault()
    setExpanded(!expanded)
    pauseScroll()
  }

  function handleUploadUpdate(uploadStatus: FilePreparationStatus[]) {
    setUploadStatus(uploadStatus)
  }

  function handleUploadComplete(updatedUploadFiles: FileForIndexing[]) {
    setUploadComplete(true)
    setUploadFiles(updatedUploadFiles)
    setIndexFiles([...updatedUploadFiles, ...indexFiles])
  }

  function handleIndexUpdate(indexStatus: FilePreparationStatus[]) {
    setIndexStatus(indexStatus)
  }

  function handleIndexComplete() {
    setIndexComplete(true)
    setIndexExpanded(false)
  }

  if (uploadFiles.length === 0 && indexFiles.length === 0) {
    return null
  }

  return (
    <div className="w-full my-2">
      {uploadFiles.length > 0 ? (
        <div>
          <div className="mr-2 w-6 h-6 align-bottom inline-block">
            <OpenAIIcon />
          </div>
          <a
            href="#"
            onClick={(event) =>
              handleClick(event, uploadExpanded, setUploadExpanded)
            }
            className="border-none bg-transparent m-0 p-0 text-black align-middle text-lg"
            style={{ textDecorationLine: "none" }}
          >
            Taking action <span className="font-bold mr-4">Upload Files</span>
            {uploadStatus ? <FileStatus status={uploadStatus} /> : ""}
            {uploadExpanded ? (
              <ChevronUpIcon className="h-6 w-6 align-middle" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 align-middle" />
            )}
          </a>
          <CSSTransition
            nodeRef={uploadRef}
            in={uploadExpanded}
            timeout={300}
            classNames="collapsible-panel"
            appear
            unmountOnExit={false}
          >
            <div
              ref={uploadRef}
              className={`px-6 py-4 rounded-md bg-white text-base my-1 ${uploadExpanded ? "" : "hidden"}`}
            >
              <FileUploader
                files={uploadFiles}
                onUpdate={handleUploadUpdate}
                onComplete={handleUploadComplete}
              />
            </div>
          </CSSTransition>
        </div>
      ) : null}
      {uploadComplete && indexFiles.length > 0 ? (
        <div className={`${uploadFiles.length > 0 ? "mt-4" : ""}`}>
          <div className="mr-2 w-6 h-6 align-bottom inline-block">
            <OpenAIIcon />
          </div>
          <a
            href="#"
            onClick={(event) =>
              handleClick(event, indexExpanded, setIndexExpanded)
            }
            className="border-none bg-transparent m-0 p-0 text-black align-middle text-lg"
            style={{ textDecorationLine: "none" }}
          >
            Taking action{" "}
            <span className="font-bold mr-4">Create Vector Index</span>
            {indexStatus ? <FileStatus status={indexStatus} /> : ""}
            {indexExpanded ? (
              <ChevronUpIcon className="h-6 w-6 align-middle" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 align-middle" />
            )}
          </a>
          <CSSTransition
            nodeRef={indexRef}
            in={indexExpanded}
            timeout={300}
            classNames="collapsible-panel"
            appear
            unmountOnExit={false}
          >
            <div
              ref={indexRef}
              className={`px-6 py-4 rounded-md bg-white text-base my-1 ${indexExpanded ? "" : "hidden"}`}
            >
              <FileIndexer
                files={indexFiles}
                onUpdate={handleIndexUpdate}
                onComplete={handleIndexComplete}
              />
            </div>
          </CSSTransition>
        </div>
      ) : null}
    </div>
  )
})
