import React, { useState, useEffect, useMemo } from "react"
import {
  CheckCircleIcon,
  ArrowUpCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid"
import { useAssistant } from "../../../hooks/useAssistant"
import { concurrencyPool } from "../../../utils/concurrency"
import type {
  FileForIndexing,
  FilePreparationStatus,
} from "../../../typings/files"
import { VectorStoreFile } from "openai/resources/beta/vector-stores/files"
import { file as log } from "../../../utils/loggers"

interface FileIndexerProps {
  onComplete: (files: FileForIndexing[]) => void
  onUpdate: (status: FilePreparationStatus[]) => void
  files: FileForIndexing[]
}

export function FileIndexer({ onComplete, onUpdate, files }: FileIndexerProps) {
  const [status, setStatus] = useState<
    Array<"STANDBY" | "IN_PROGRESS" | "COMPLETED">
  >(files.map(({ index }) => (index ? "COMPLETED" : "STANDBY")))
  const [indexResponses, setIndexResponses] = useState(
    new Array<VectorStoreFile | undefined>(files.length).fill(undefined),
  )
  const [isCancelled, setIsCancelled] = useState(false)
  const { assistant } = useAssistant()

  useEffect(() => {
    // Worker that handles the upload for a single file
    const indexWorker = async (
      { item, file, index }: FileForIndexing,
      i: number,
    ) => {
      if (isCancelled || index) return

      setStatus((prev) => {
        const newArr = [...prev]
        newArr[i] = "IN_PROGRESS"
        return newArr
      })

      // Simulate an async file indexing:
      // await new Promise<void>((resolve) => {
      //   setTimeout(
      //     () => {
      //       if (isCancelled) return
      //       const response = {
      //         id: file as string,
      //         object: "vector_store.file" as const,
      //         created_at: 1699061776,
      //         usage_bytes: 1234,
      //         vector_store_id: assistant.currentVectorStore as string,
      //         status: "completed" as const,
      //         last_error: null,
      //       }
      //       setStatus((prev) => {
      //         const newArr = [...prev]
      //         newArr[i] = "COMPLETED"
      //         return newArr
      //       })
      //       setIndexResponses((prev) => {
      //         const newArr = [...prev]
      //         newArr[i] = response
      //         return newArr
      //       })
      //       resolve()
      //     },
      //     Math.random() * 2000 + 1000,
      //   )
      // })

      // Real file uploading logic
      const response = await assistant.indexFile(file as string)
      setStatus((prev) => {
        const newArr = [...prev]
        newArr[i] = "COMPLETED"
        return newArr
      })
      setIndexResponses((prev) => {
        const newArr = [...prev]
        newArr[i] = response
        return newArr
      })
      assistant.registerIndexedFile(item)
      // log("Indexed file: ", file, response)
    }
    concurrencyPool(files, indexWorker).catch((err) => {
      log("Error indexing files: ", err)
    })

    return () => {
      setIsCancelled(true)
    }
  }, [files, isCancelled])

  useEffect(() => {
    if (indexResponses.every((response) => response?.status === "completed")) {
      const updatedFiles = files.map((file) => ({
        ...file,
        index: assistant.currentVectorStore as string,
      }))
      onComplete(updatedFiles)
    }
  }, [indexResponses])

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
                <ArrowUpCircleIcon
                  title="indexing"
                  className="w-5 h-5 text-amber-500 animate-pulse"
                />
              ) : indexResponses[i]?.status === "completed" ||
                (!indexResponses[i] && status[i] === "COMPLETED") ? (
                <CheckCircleIcon className="w-5 h-5 text-lime-500" />
              ) : (
                <ExclamationCircleIcon
                  title="error"
                  className="w-5 h-5 text-red-500"
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
