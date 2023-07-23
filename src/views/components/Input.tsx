import React, { useState, useEffect, useRef } from 'react'
import { Message } from '../hooks/useMessages'

interface InputProps {
  isLoading: boolean
  onSubmit: (contnt: string) => void
}

export function Input({ isLoading, onSubmit }: InputProps) {
  const [lastValue, setLastValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current !== null) {
      const ref = inputRef.current as HTMLTextAreaElement
      ref.style.height = ref.scrollHeight + 'px'
    }
  })

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    }
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (inputRef.current === null || event.currentTarget.value === lastValue) {
      return
    }
    const ref = inputRef.current as HTMLTextAreaElement
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit(event.currentTarget.value)
      setLastValue(event.currentTarget.value)
      event.currentTarget.value = ''
      ref.style.height = '1.5rem' // reset height to h-6
    } else {
      ref.style.height = ref.scrollHeight + 'px'
    }
  }

  return (
    <div className="fixed bottom-6 w-[calc(100%-44px)] px-3 py-2 rounded border border-neutral-500 bg-white shadow-md z-50 m-0">
      <div>
        <textarea
          id="aria-chat-input"
          ref={inputRef}
          className="w-full h-6 max-h-64 resize-none border-none text-base overflow-y-auto text-black"
          placeholder="How can I help you today?"
          autoFocus
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        />
        {isLoading && (
          <div className="absolute right-6 bottom-4">
            <div className="dot-flashing "></div>
          </div>
        )}
      </div>
    </div>
  )
}
