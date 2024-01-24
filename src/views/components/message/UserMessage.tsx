import React, { useState, useRef } from 'react'
import { Square2StackIcon, PencilSquareIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Input, InputProps } from '../input/Input'
import { useDragging } from '../../hooks/useDragging'
import { SelectionIcon } from '../../icons/zotero'
import {
  StateName,
  States,
  StateSelections,
  stateNames,
  selectionConfig,
  areStatesEmpty,
} from '../../../models/utils/states'
import { TextField } from '../input/TextField'
import { UserMessageProps } from './types'

interface SelectionToggleProps {
  name: StateName
  state: StateSelections
  selectedName: StateName | null
  setSelectedName: (name: StateName | null) => void
}

function SelectionToggle({ name, state, selectedName, setSelectedName }: SelectionToggleProps) {
  if (state.length === 0) {
    return null
  }
  const selected = name === selectedName
  const label = selectionConfig[name].label
  const header = state.length > 1 ? label.plural : label.singular

  function handleClick() {
    if (selected) {
      setSelectedName(null)
    } else {
      setSelectedName(name)
    }
  }

  return (
    <div className="inline" onClick={handleClick}>
      {selected ? (
        <ChevronDownIcon className="w-3 h-3 text-black" aria-hidden="true" />
      ) : (
        <ChevronRightIcon className="w-3 h-3 text-black" aria-hidden="true" />
      )}
      <span className={`ml-2 capitalize ${selected ? 'text-tomato' : 'text-neutral-500'}`}>
        {header} ({state.length})
      </span>
    </div>
  )
}

interface SelectionDetailProps {
  name: StateName
  state: StateSelections
}

function SelectionDetail({ name, state }: SelectionDetailProps) {
  return (
    <div className="self-end">
      {state.map(({ id, type, title }) => {
        return (
          <div key={id} className="flex flex-initial">
            <span className="flex-none">
              <SelectionIcon name={name} key={id} type={type} />
            </span>
            <span className="px-1 truncate flex-auto">{title}</span>
          </div>
        )
      })}
    </div>
  )
}

interface StatesInfoProps {
  states: States
}

function StatesInfo({ states }: StatesInfoProps) {
  const [selectedName, setSelectedName] = useState<StateName | null>(null)
  if (areStatesEmpty(states)) {
    return null
  }

  return (
    <div className="flex flex-col text-sm mt-1">
      <div className="self-end space-x-4">
        {stateNames.map(name => (
          <SelectionToggle
            key={name}
            name={name}
            state={states[name]}
            selectedName={selectedName}
            setSelectedName={setSelectedName}
          />
        ))}
      </div>
      {selectedName ? <SelectionDetail name={selectedName} state={states[selectedName]} /> : null}
    </div>
  )
}

interface GalleryProps {
  images: States['images']
}

function Gallery({ images }: GalleryProps) {
  if (!images || images.length === 0) {
    return null
  }
  return (
    <div className="flex flex-row flex-wrap items-end self-end">
      {images.map(({ id, title, image }) => (
        <div key={id} className="relative border border-solid border-neutral-300">
          <div className="h-6 flex flex-row px-1" style={{ backgroundColor: selectionConfig.images.backgroundColor }}>
            <div className="flex-none text-sm text-black">{id}</div>
          </div>
          <div className="h-40">
            <img className="h-full aspect-auto" src={image} title={title} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function UserMessage({
  id,
  content,
  states,
  onSubmit,
  copyId,
  setCopyId,
  editId,
  setEditId,
  setPromptTemplate,
}: UserMessageProps) {
  // const [displayMenu, setDisplayMenu] = useState(false)
  const { setDropArea } = useDragging()
  const [isEdit, setIsEdit] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isShortMessage = ref?.current?.offsetWidth && ref.current?.offsetWidth < 64

  // function handleMouseEnter() {
  //   setDisplayMenu(true)
  // }

  // function handleMouseLeave() {
  //   setDisplayMenu(false)
  // }

  function handleCopy() {
    // setDisplayMenu(false)
    new ztoolkit.Clipboard().addText(content.newPlainTextValue, 'text/unicode').copy()
    setCopyId(id)
  }

  function handleEdit() {
    setDropArea(id)
    // setDisplayMenu(false)
    // setIsEdit(true)
    setEditId(id)
  }

  function handleSubmit(...args: Parameters<typeof onSubmit>) {
    setDropArea(undefined)
    // setIsEdit(false)
    setEditId(undefined)
    onSubmit(...args)
  }

  function handleCancel() {
    setDropArea(undefined)
    // setDisplayMenu(false)
    // setIsEdit(false)
    setEditId(undefined)
  }

  return (
    <div
      className="w-auto self-end max-w-[70%] my-2 pb-2"
      // onMouseEnter={handleMouseEnter}
      // onMouseLeave={handleMouseLeave}
    >
      {id === editId ? (
        <div
          ref={ref}
          className="bg-tomato p-2 border border-neutral-500 rounded shadow-md shadow-black/20 text-black break-words min-w-[320px]"
        >
          <Input
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            id={id}
            content={content}
            inputStates={states}
            setPromptTemplate={setPromptTemplate}
          />
        </div>
      ) : (
        <div className="flex flex-col">
          <div
            ref={ref}
            className="relative self-end bg-tomato p-2 [&>*]:mx-2 [&_*]:my-0 [&_*]:leading-6 border border-neutral-500 rounded shadow-md shadow-black/20 text-white break-words"
          >
            <TextField
              states={states}
              isEdit={false}
              value={content}
              forceSuggestionsAboveCursor={false}
              setPromptTemplate={setPromptTemplate}
            />
            <div className="flex pt-3">
              <div className="flex-auto"></div>
              <div className="flex-none flex flex-row space-x-2">
                <div className="rounded border border-solid border-white bg-transparent text-white">
                  <button
                    type="button"
                    className="relative inline-flex items-center bg-transparent hover:bg-red-800 focus:z-10 border-none px-2 py-1 rounded"
                    aria-label="Copy"
                    onClick={handleCopy}
                  >
                    <Square2StackIcon className="w-5 h-5 text-white" aria-hidden="true" />
                    <span className="ml-2 text-sm text-white">{copyId === id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="rounded border border-solid border-white bg-transparent text-white">
                  <button
                    type="button"
                    className="relative inline-flex items-center bg-transparent hover:bg-red-800 focus:z-10 border-none px-2 py-1 rounded"
                    aria-label="Edit"
                    onClick={handleEdit}
                  >
                    <PencilSquareIcon className="w-5 h-5 text-white" aria-hidden="true" />
                    <span className="ml-2 text-sm text-white">Edit</span>
                  </button>
                </div>
                {/* 
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
                </div> */}
              </div>
            </div>
          </div>
          <StatesInfo states={states} />
          <Gallery images={states.images} />
        </div>
      )}
    </div>
  )
}
