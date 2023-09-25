import React, { useState, useRef } from 'react'
import { Square2StackIcon, PencilSquareIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Input, InputProps } from '../input/Input'
import { useDragging } from '../../hooks/useDragging'
import { ItemIcon, CollectionIcon } from '../../icons/zotero'
import { States } from '../../../models/utils/states'

interface AccordionProps {
  states: States
}

function Accordion({ states }: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  if (states.selectedItems && states.selectedItems.length > 0) {
    const header = `Items (${states.selectedItems.length})`
    return (
      <div className="flex flex-col text-sm mt-1">
        <div className="self-end" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3 text-black" aria-hidden="true" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 text-black" aria-hidden="true" />
          )}
          <span className="ml-2">{header}</span>
        </div>
        {isExpanded ? (
          <div className="self-end">
            {states.selectedItems.map(({ id, type, title }) => {
              return (
                <div key={id} className="flex flex-initial">
                  <span className="flex-none">
                    <ItemIcon key={id} type={type} />
                  </span>
                  <span className="px-1 truncate flex-auto">{title}</span>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    )
  } else if (states.selectedCollection) {
    return (
      <div className="self-end text-sm mt-1">
        <span className="flex-none">
          <CollectionIcon />
        </span>
        <span className="pl-1 leading-6">{states.selectedCollection.label}</span>
      </div>
    )
  } else {
    return null
  }
}

export interface UserMessageProps extends InputProps {
  id: string
  timestamp: string
  type: 'USER_MESSAGE'
  content: string
  states: States
}

export function UserMessage({ id, content, states, onSubmit }: UserMessageProps) {
  const [displayMenu, setDisplayMenu] = useState(false)
  const { setDropArea } = useDragging()
  const [isEdit, setIsEdit] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
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
    setDropArea(id)
    setDisplayMenu(false)
    setIsEdit(true)
  }

  function handleSubmit(...args: Parameters<typeof onSubmit>) {
    setDisplayMenu(false)
    setIsEdit(false)
    onSubmit(...args)
  }

  function handleCancel() {
    setDropArea(undefined)
    setDisplayMenu(false)
    setIsEdit(false)
  }

  return (
    <div
      className="w-auto self-end max-w-[70%] my-2 pb-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isEdit ? (
        <div
          ref={ref}
          className="bg-tomato p-2 border border-neutral-500 rounded shadow-md shadow-black/20 text-white break-words"
        >
          <Input onSubmit={handleSubmit} onCancel={handleCancel} id={id} content={content} inputStates={states} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div
            ref={ref}
            className="relative self-end bg-tomato p-2 [&>*]:mx-2 [&_*]:my-0 [&_*]:leading-6 border border-neutral-500 rounded shadow-md shadow-black/20 text-white break-words"
          >
            <pre className="whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
              {content}
            </pre>
            {displayMenu && (
              <div className={`absolute pb-3 text-sm -top-8 ${isShortMessage ? '-right-2' : '-left-2 pr-12'}`}>
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
          <Accordion states={states} />
        </div>
      )}
    </div>
  )
}
