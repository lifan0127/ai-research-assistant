import React, { useState, useEffect, useMemo } from "react"
import {
  CheckCircleIcon,
  ArrowUpCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid"
import { useAssistant } from "../../../hooks/useAssistant"
import { concurrencyPool } from "../../../utils/concurrency"
import type {
  FileForIndexing,
  FilePreparationStatus,
} from "../../../typings/files"
import { zipWith } from "lodash"

interface FileUploaderProps {
  onComplete: (files: FileForIndexing[]) => void
  onUpdate: (status: FilePreparationStatus[]) => void
  files: FileForIndexing[]
}

export function FileUploader({
  onComplete,
  onUpdate,
  files,
}: FileUploaderProps) {
  const [status, setStatus] = useState<FilePreparationStatus[]>(
    files.map(({ file }) => (file ? "COMPLETED" : "STANDBY")),
  )
  const [fileIds, setFileIds] = useState(files.map(({ file }) => file))
  const [isCancelled, setIsCancelled] = useState(false)
  const { assistant } = useAssistant()

  useEffect(() => {
    // Worker that handles the upload for a single file
    const uploadWorker = async (
      { item, attachment, file }: FileForIndexing,
      i: number,
    ) => {
      if (isCancelled || file) return

      setStatus((prev) => {
        const newArr = [...prev]
        newArr[i] = "IN_PROGRESS"
        return newArr
      })

      // Simulate an async file upload:
      // await new Promise<void>((resolve) => {
      //   setTimeout(
      //     () => {
      //       if (isCancelled) return
      //       const fileId = Zotero.Utilities.randomString(12)
      //       setStatus((prev) => {
      //         const newArr = [...prev]
      //         newArr[i] = "COMPLETED"
      //         return newArr
      //       })
      //       setFileIds((prev) => {
      //         const newArr = [...prev]
      //         newArr[i] = fileId
      //         return newArr
      //       })
      //       resolve()
      //     },
      //     Math.random() * 2000 + 1000,
      //   )
      // })

      // Real file uploading logic
      const fileId = await assistant.uploadFile(
        item,
        attachment as Zotero.Item,
        "assistants",
      )
      setStatus((prev) => {
        const newArr = [...prev]
        newArr[i] = "COMPLETED"
        return newArr
      })
      setFileIds((prev) => {
        const newArr = [...prev]
        newArr[i] = fileId
        return newArr
      })
      assistant.registerUploadedFile(item, attachment as Zotero.Item, fileId)
    }

    concurrencyPool(files, uploadWorker).catch((err) => {
      console.error("Error uploading files: ", err)
    })

    return () => {
      setIsCancelled(true)
    }
  }, [files, isCancelled])

  useEffect(() => {
    if (fileIds.every((id) => id !== undefined)) {
      const updatedFiles = zipWith(files, fileIds, (file, fileId) => ({
        ...file,
        file: fileId,
      }))
      onComplete(updatedFiles)
    }
  }, [fileIds])

  useEffect(() => {
    onUpdate(status)
  }, [status])

  if (files.length === 0) {
    return null
  }

  return (
    <table className="w-full table-auto border-collapse">
      <tbody>
        {files.map(({ item, attachment }, i) => (
          <tr
            key={item.id}
            className="border-b last:border-b-0 border-gray-100"
          >
            <td className="py-2 pr-2">{attachment!.attachmentFilename}</td>
            <td className="py-2 pl-2">
              {status[i] === "STANDBY" ? (
                <ClockIcon className="w-5 h-5 text-slate-300" />
              ) : status[i] === "IN_PROGRESS" ? (
                <ArrowUpCircleIcon className="w-5 h-5 text-amber-500 animate-pulse" />
              ) : (
                <CheckCircleIcon className="w-5 h-5 text-lime-500" />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
