import React from "react"
import {
  DocumentArrowUpIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

export function FileUploadIcon() {
  return (
    <span className="mx-0.5">
      <DocumentArrowUpIcon className="text-tomato" />
    </span>
  )
}

export function FileIndexIcon() {
  return (
    <span className="mx-0.5">
      <DocumentMagnifyingGlassIcon className="text-tomato" />
    </span>
  )
}
