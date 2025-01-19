import React, { memo } from "react"
import {
  CheckCircleIcon,
  ArrowUpCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid"
import { FilePreparationStatus } from "../../../typings/files"

interface FileStatusProps {
  status: FilePreparationStatus[]
}

export const FileStatus = function FileStatusComponent({
  status,
}: FileStatusProps) {
  const standBy = status.filter((s) => s === "STANDBY").length
  const inProgress = status.filter((s) => s === "IN_PROGRESS").length
  const completed = status.filter((s) => s === "COMPLETED").length
  return (
    <span>
      <ClockIcon className="w-5 h-5 text-slate-300 align-text-bottom" />
      <span className="mx-2">{standBy}</span>
      <ArrowUpCircleIcon className="w-5 h-5 text-amber-500 align-text-bottom" />
      <span className="mx-2">{inProgress}</span>
      <CheckCircleIcon className="w-5 h-5 text-lime-500 align-text-bottom" />
      <span className="ml-2">{completed}</span>
    </span>
  )
}
