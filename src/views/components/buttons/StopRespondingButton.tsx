import React from "react"
import { marked } from "marked"
import { StopIcon } from "@heroicons/react/24/solid"
import { stopRespondingButtonDef } from "./types"
import { BotMessageStatus } from "../../../typings/legacyMessages"

interface StopRespondingButtonProps extends stopRespondingButtonDef {
  status: BotMessageStatus
}

export function StopRespondingButton({
  status,
  utils,
}: StopRespondingButtonProps) {
  return (
    <div className="rounded border border-solid border-neutral-300">
      <button
        type="button"
        className="relative inline-flex items-center bg-white text-neutral-500 hover:bg-gray-200 focus:z-10 rounded border-none px-2 py-1"
        aria-label="Stop Responding"
        onClick={utils.stopResponding}
      >
        <StopIcon className="w-5 h-5 text-tomato align-middle" />
        <span className="ml-2 text-sm">Stop Responding</span>
      </button>
    </div>
  )
}
