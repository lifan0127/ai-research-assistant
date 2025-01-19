import React, { useState, useEffect, useRef } from "react"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { CSSTransition } from "react-transition-group"
import { FileUploader } from "./FileUploader"
import { FileIndexer } from "./FileIndexer"
import { FileUploadIcon } from "../../icons/file"
import { FileStatus } from "./FileStatus"
import { FileIndexIcon } from "../../icons/file"
import { FileForIndexing, FilePreparationStatus } from "../../../typings/files"

interface FilePreparationProps {
  files: FileForIndexing[]
  onComplete: () => void
  pauseScroll: () => void
}

export function FilePreparation({
  files,
  onComplete,
  pauseScroll,
}: FilePreparationProps) {
  const [uploadFiles, setUploadFiles] = useState<FileForIndexing[]>(
    files.filter(({ attachment, file }) => attachment && !file),
  )
  const [indexFiles, setIndexFiles] = useState<FileForIndexing[]>(
    files.filter(({ file, index }) => file && !index),
  )
  const [uploadComplete, setUploadComplete] = useState(uploadFiles.length === 0)
  const [indexComplete, setIndexComplete] = useState(false)
  const [uploadExpanded, setUploadExpanded] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<FilePreparationStatus[]>()
  const [indexExpanded, setIndexExpanded] = useState(false)
  const [indexStatus, setIndexStatus] = useState<FilePreparationStatus[]>()
  const uploadRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (uploadComplete && indexComplete) {
      onComplete()
    }
  }, [uploadComplete, indexComplete, onComplete])

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

  return (
    <div className="w-full">
      {uploadFiles.length > 0 ? (
        <div>
          <div className="mr-2 w-6 h-6 align-bottom inline-block">
            <FileUploadIcon />
          </div>
          <a
            href="#"
            onClick={(event) =>
              handleClick(event, uploadExpanded, setUploadExpanded)
            }
            className="border-none bg-transparent m-0 p-0 text-black align-middle text-lg"
            style={{ textDecorationLine: "none" }}
          >
            Uploading {uploadFiles.length}{" "}
            {uploadFiles.length > 1 ? "files" : "file"}
            {" ... "}
            {uploadComplete ? (
              "done"
            ) : uploadStatus ? (
              <FileStatus status={uploadStatus} />
            ) : (
              ""
            )}
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
        <div>
          <div className="mr-2 w-6 h-6 align-bottom inline-block">
            <FileIndexIcon />
          </div>
          <a
            href="#"
            onClick={(event) =>
              handleClick(event, indexExpanded, setIndexExpanded)
            }
            className="border-none bg-transparent m-0 p-0 text-black align-middle text-lg"
            style={{ textDecorationLine: "none" }}
          >
            Indexing {indexFiles.length}{" "}
            {indexFiles.length > 1 ? "files" : "file"}
            {" ... "}
            {indexComplete ? (
              "done"
            ) : indexStatus ? (
              <FileStatus status={indexStatus} />
            ) : (
              ""
            )}
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
            unmountOnExit={false}
          >
            <div
              ref={indexRef}
              className="px-6 py-4 rounded-md bg-white text-base my-1"
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
}
