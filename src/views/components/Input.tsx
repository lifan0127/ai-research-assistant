import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Message } from '../hooks/useMessages'

export interface InputBoxProps {
  onSubmit: (contnt: string, id?: string) => void
  id?: string
  content?: string
}

export const InputBox = forwardRef(function InputBox({ onSubmit, id, content }: InputBoxProps, ref) {
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => inputRef.current)

  useEffect(() => {
    if (inputRef?.current !== null) {
      const current = inputRef.current as HTMLTextAreaElement
      current.style.height = current.scrollHeight + 'px'
      current.selectionStart = current.value.length
    }
  })

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    }
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (inputRef.current === null || event.currentTarget.value === '') {
      return
    }
    const current = inputRef.current as HTMLTextAreaElement
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit(event.currentTarget.value, id)
      event.currentTarget.value = ''
      current.style.height = '1.5rem' // reset height to h-6
    } else {
      current.style.height = current.scrollHeight + 'px'
    }
  }

  return (
    <div>
      <textarea
        id="aria-chat-input"
        ref={inputRef}
        className="w-full h-6 max-h-64 resize-none border-none text-base overflow-y-auto text-black bg-white"
        placeholder="How can I help you today?"
        defaultValue={content}
        autoFocus
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      />
    </div>
  )
})

interface InputProps {
  isLoading: boolean
  onSubmit: (contnt: string) => void
}

export function Input({ isLoading, ...props }: InputProps) {
  return (
    <div className="fixed bottom-6 w-[calc(100%-44px)] px-3 py-2 rounded border border-neutral-500 bg-white shadow-md z-50 m-0">
      <div>
        <InputBox {...props} />
        {isLoading && (
          <div className="absolute right-6 bottom-4">
            <div className="dot-flashing "></div>
          </div>
        )}
      </div>
    </div>
  )
}
