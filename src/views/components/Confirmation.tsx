import React, { useRef } from 'react'
import { config } from '../../../package.json'
import { Modal } from './menu/Modal'

interface ConfirmationProps {
  message: React.ReactNode
  open: boolean
  setOpen: (open: boolean) => void
  callback?: () => void
}

export function Confirmation({ message, open, setOpen, callback }: ConfirmationProps) {
  if (!open) {
    return null
  }

  async function handleConfirm() {
    callback && (await callback())
    setOpen(false)
  }

  return (
    <Modal>
      <div>{message}</div>

      <div className="mt-2 sm:mt-4 flex flex-col md:flex-row w-full space-y-4 md:space-x-4 md:space-y-0">
        <button
          type="button"
          className="flex-auto rounded-md bg-tomato px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
          onClick={handleConfirm}
        >
          Confirm
        </button>
        <button
          type="button"
          className="flex-auto rounded-md bg-neutral-400 px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
