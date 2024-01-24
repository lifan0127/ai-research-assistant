import React, { useState, useEffect, useRef } from 'react'
import { PaperAirplaneIcon as PaperAirplaneIconDisabled } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
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
  disabled?: boolean
  isLoading?: boolean
  promptTemplate?: { template: string }
  setPromptTemplate: (template: { template: string } | undefined) => void
}

export function Input({
  onSubmit,
  onCancel,
  id,
  content,
  inputStates,
  disabled = false,
  isLoading,
  promptTemplate,
  setPromptTemplate,
}: InputProps) {
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

  // useEffect(() => {})
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
    <div className="relative rounded border border-neutral-500 bg-white shadow-md px-3 pt-2 pb-1">
      {disabled ? null : <States states={states} />}
      <div className="relative">
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
          promptTemplate={promptTemplate}
          setPromptTemplate={setPromptTemplate}
        />
        {disabled ? (
          <div className="absolute bg-white top-0 left-0 bottom-0 right-0 w-full height-full text-neutral-500 z-40 flex">
            <div className="m-auto">
              Please finish editing and close the message edit window to resume the conversation here.
            </div>
          </div>
        ) : null}
        {id ? null : (
          <>
            {isLoading ? (
              <div className="absolute -top-2 right-4 pt-4 z-10">
                <div className="dot-flashing "></div>
              </div>
            ) : null}
            <div className="absolute bottom-0 right-0 pt-4 z-10">
              {states.value.newPlainTextValue !== '' ? (
                <button
                  className="border-none bg-transparent m-0 p-1 rounded-full text-tomato hover:bg-gray-200"
                  onClick={() => handleSubmit()}
                >
                  <PaperAirplaneIcon className="w-6 h-6" />
                </button>
              ) : (
                <div className="p-1">
                  <PaperAirplaneIconDisabled className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
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
