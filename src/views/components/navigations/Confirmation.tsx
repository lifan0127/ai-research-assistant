import React, { useState, useEffect } from "react"
import { config } from "../../../../package.json"
import { Modal } from "./Modal"
import { menu as log } from "../../../utils/loggers"

interface ConfirmationProps {
  message: React.ReactNode
  open: boolean
  setOpen: (open: boolean) => void
  callback?: (setProgress: (pct: number) => void) => void
}

export function Confirmation({
  message,
  open,
  setOpen,
  callback,
}: ConfirmationProps) {
  const [progress, setProgress] = useState(0)
  const [disabled, setDisabled] = useState(false)

  useEffect(() => {
    if (progress >= 100) {
      setOpen(false)
      setDisabled(false)
      setProgress(0)
    }
  }, [progress])

  if (!open) {
    return null
  }

  async function handleConfirm() {
    if (callback) {
      await callback(setProgress)
    }
  }

  return (
    <Modal>
      <div>{message}</div>
      <div
        style={{ visibility: progress ? "visible" : "hidden" }}
        className="overflow-hidden rounded-full bg-gray-200 mt-3 mb-6"
      >
        <div
          style={{
            width: `${progress.toFixed(0)}%`,
            transition: "width 0.25s ease-in-out",
          }}
          className="h-2 rounded-full bg-tomato"
        />
      </div>
      <div className="mt-2 sm:mt-4 flex flex-col md:flex-row w-full space-y-4 md:space-x-4 md:space-y-0">
        <button
          type="button"
          className="flex-auto rounded-md bg-tomato px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
          onClick={handleConfirm}
          disabled={disabled}
        >
          Confirm
        </button>
        <button
          type="button"
          className="flex-auto rounded-md bg-neutral-400 px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
          onClick={() => setOpen(false)}
          disabled={disabled}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
