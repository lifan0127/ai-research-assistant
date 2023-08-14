import React, { useState, useRef } from 'react'
import { CheckIcon, XMarkIcon, Square2StackIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { InputBox, InputBoxProps } from '../Input'

export interface UserMessageProps extends InputBoxProps {
  id: string
  timestamp: string
  type: 'USER_MESSAGE'
  content: string
}

export function UserMessage({ id, content, onSubmit }: UserMessageProps) {
  const [displayMenu, setDisplayMenu] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef()
  const isShortMessage = ref?.current?.offsetWidth && ref.current?.offsetWidth < 64

  function handleMouseEnter() {
    setDisplayMenu(true)
  }

  function handleMouseLeave() {
    setDisplayMenu(false)
  }

  function handleCopy() {
    setDisplayMenu(false)
    new ztoolkit.Clipboard().addText(content, 'text/unicode').copy()
  }

  function handleEdit() {
    setDisplayMenu(false)
    setIsEdit(true)
  }

  function handleSubmit(...args: Parameters<typeof onSubmit>) {
    setDisplayMenu(false)
    setIsEdit(false)
    onSubmit(...args)
  }

  function handleConfirm() {
    if (inputRef.current) {
      onSubmit((inputRef.current as HTMLTextAreaElement).value, id)
      setDisplayMenu(false)
      setIsEdit(false)
    }
  }

  function handleCancel() {
    setDisplayMenu(false)
    setIsEdit(false)
  }

  return (
    <div
      className="relative w-auto self-end max-w-[70%] my-2 pb-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isEdit ? (
        <div
          ref={ref}
          className="bg-tomato p-2 border border-neutral-500 rounded shadow-md shadow-black/20 text-white break-words"
        >
          <InputBox ref={inputRef} onSubmit={handleSubmit} id={id} content={content} />
          <div className="text-right">
            <span className="inline-flex rounded-md shadow-sm mt-1">
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none p-1 rounded-full mr-2"
                aria-label="Cancel"
                onClick={handleCancel}
              >
                <XMarkIcon className="w-4 h-4 text-black" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none p-1 rounded-full"
                aria-label="Confirm"
                onClick={handleConfirm}
              >
                <CheckIcon className="w-4 h-4 text-black" aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      ) : (
        <div
          ref={ref}
          className="bg-tomato p-2 [&>*]:mx-2 [&_*]:my-0 [&_*]:leading-6 border border-neutral-500 rounded shadow-md shadow-black/20 text-white break-words"
        >
          <pre className="whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
            {content}
          </pre>
        </div>
      )}
      {displayMenu && (
        <div className={`absolute pb-3 text-sm -top-8 ${isShortMessage ? 'right-0' : 'left-0 pr-12'}`}>
          <div className="bg-white mb-3 rounded border border-neutral-500 shadow-md text-black">
            <span className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none px-2 py-1"
                aria-label="Edit"
                onClick={handleEdit}
              >
                <PencilSquareIcon className="w-5 h-5 text-black" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none px-2 py-1"
                aria-label="Copy"
                onClick={handleCopy}
              >
                <Square2StackIcon className="w-5 h-5 text-black" aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
