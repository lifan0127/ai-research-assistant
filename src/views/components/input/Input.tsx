import React, { useState, useEffect, useRef, useImperativeHandle } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useStates } from '../../hooks/useStates'
import { useDragging } from '../../hooks/useDragging'
import { States } from './States'
import { DragArea } from './DragArea'
import { States as StatesSchema } from '../../../models/utils/states'

export interface InputProps {
  onSubmit: (input: { content: string; states: StatesSchema }, id?: string) => void
  onCancel?: () => void
  id?: string
  content?: string
  inputStates?: StatesSchema
}

export const Input = function InputBox({ onSubmit, onCancel, id, content, inputStates }: InputProps) {
  const [dropText, setDropText] = useState<string>('')
  const { isDragging, setIsDragging, dropArea, setDropArea } = useDragging()
  const inputRef = useRef(null)
  const {
    states,
    addSelectedItems,
    removeSelectedItem,
    removeAllSelectedItems,
    setSelectedCollection,
    removeSelectedCollection,
    resetStates,
  } = useStates(inputStates)

  useEffect(() => {
    if (inputRef?.current !== null) {
      const current = inputRef.current as HTMLTextAreaElement
      current.style.height = current.scrollHeight + 'px'
      current.selectionStart = current.value.length
    }
  })

  useEffect(() => {
    if (inputRef?.current !== null && dropText !== '') {
      const current = inputRef.current as HTMLTextAreaElement
      current.value += dropText?.trim()
    }
  }, [dropText])

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    }
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (inputRef.current === null) {
      return
    }
    const current = inputRef.current as HTMLTextAreaElement
    if (event.key === 'Enter' && !event.shiftKey && event.currentTarget.value !== '') {
      event.preventDefault()
      onSubmit({ content: event.currentTarget.value, states }, id)
      resetStates()
      current.value = ''
      current.style.height = '1.5rem' // reset height to h-6
    } else {
      current.style.height = '1.5rem' // need this to trigger scrollHeight refresh when deleting lines
      current.style.height = current.scrollHeight.toString() + 'px'
    }
  }

  function handleConfirm() {
    if (inputRef.current) {
      onSubmit({ content: (inputRef.current as HTMLTextAreaElement).value, states }, id)
    }
  }

  function handleCancel() {
    onCancel && onCancel()
  }

  return (
    <div className="relative rounded border border-neutral-500 bg-white shadow-md px-3 py-2">
      <States
        states={states}
        removeSelectedItem={removeSelectedItem}
        removeAllSelectedItems={removeAllSelectedItems}
        removeSelectedCollection={removeSelectedCollection}
      />
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
      {id ? (
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
      ) : null}
      {isDragging && id === dropArea ? (
        <DragArea
          id={id}
          setDropText={setDropText}
          onDragEnter={() => setIsDragging(isDragging + 1)}
          onDragLeave={() => setIsDragging(isDragging - 1)}
          addSelectedItems={addSelectedItems}
          setSelectedCollection={setSelectedCollection}
          inputRef={inputRef}
        />
      ) : null}
    </div>
  )
}
