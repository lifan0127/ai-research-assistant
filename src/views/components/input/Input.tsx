import React, { useState, useEffect, useRef } from 'react'
import { useStates } from '../../hooks/useStates'
import { useDragging } from '../../hooks/useDragging'
import { States } from './States'
import { DragArea } from './DragArea'
import { States as StatesSchema, MentionValue } from '../../../models/utils/states'
import { TextField } from './TextField'
import { isEqual } from 'lodash'

export interface InputProps {
  onSubmit: (input: { content: MentionValue; states: StatesSchema }, id?: string) => void
  onCancel?: () => void
  id?: string
  content?: MentionValue
  inputStates?: StatesSchema
}

export const Input = function InputBox({ onSubmit, onCancel, id, content, inputStates }: InputProps) {
  const [dropText, setDropText] = useState<string>('')
  const { isDragging, setIsDragging, dropArea, setDropArea } = useDragging()
  const inputRef = useRef(null)
  const states = useStates(inputStates, content)

  useEffect(() => {
    if (inputRef?.current !== null) {
      const current = inputRef.current as HTMLTextAreaElement
      current.selectionStart = current.value.length
    }
  }, [content])
  // useEffect(() => {
  //   if (inputRef?.current !== null) {
  //     const current = inputRef.current as HTMLTextAreaElement
  //     current.style.height = current.scrollHeight + 'px'
  //     current.selectionStart = current.value.length
  //   }
  // })

  // useEffect(() => {
  //   if (inputRef?.current !== null && dropText !== '') {
  //     const current = inputRef.current as HTMLTextAreaElement
  //     current.value += dropText?.trim()
  //   }
  // }, [dropText])

  // function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  //   if (event.key === 'Enter' && !event.shiftKey) {
  //     event.preventDefault()
  //   }
  // }

  function handleSubmit() {
    onSubmit({ content: states.value, states: states.states }, id)
    if (!id) {
      states.reset()
    }
  }

  return (
    <div className="relative rounded border border-neutral-500 bg-white shadow-md px-3 py-2">
      <States states={states} />
      <div>
        <TextField
          ref={inputRef}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          displayButtons={id !== undefined}
          states={states.states}
          resetStates={states.reset}
          value={states.value}
          setValue={states.setValue}
          forceSuggestionsAboveCursor={!id}
        />
        {/* <textarea
          id="aria-chat-input"
          ref={inputRef}
          className="w-full h-16 max-h-64 resize-none border-none text-base overflow-y-auto text-black bg-white"
          placeholder="How can I help you today?"
          defaultValue={content}
          autoFocus
          onKeyDown={handleKeyDown}
          // onKeyUp={handleKeyUp}
        /> */}
      </div>
      {/* {id ? (
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
      ) : null} */}
      {isDragging && id === dropArea ? (
        <DragArea
          id={id}
          value={states.value}
          setValue={states.setValue}
          onDragEnter={() => setIsDragging(isDragging + 1)}
          onDragLeave={() => setIsDragging(isDragging - 1)}
          addSelection={states.add}
          inputRef={inputRef}
        />
      ) : null}
    </div>
  )
}
