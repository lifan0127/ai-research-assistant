import React, { useState } from 'react'
import { DocumentTextIcon, PlusSmallIcon, MinusSmallIcon } from '@heroicons/react/24/outline'
import { BotMessageProps, UserMessageProps } from '../message/types'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { noteButtonDef } from './types'
import { createStandaloneNote, createChildNote } from '../../../apis/zotero'

interface NoteButtonProps extends noteButtonDef {
  input: BotMessageProps['input']
  states?: UserMessageProps['states']
}

export function NoteButton({ utils, input, states }: NoteButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false))
  const items = states?.items ?? []

  function handleOpen() {
    setOpen(!open)
  }

  async function createNote() {
    const content = await utils.createNote(input)
    const note = await createStandaloneNote(content)
    ZoteroPane.selectItem(note.id, true)
  }

  async function addNoteToItem(itemId: number) {
    const content = await utils.createNote(input)
    const note = await createChildNote(content, itemId as number)
    ZoteroPane.selectItem(note.id)
  }

  return (
    <div className="relative">
      <div className="rounded border border-solid border-neutral-300">
        <button
          ref={ref}
          type="button"
          className="relative inline-flex items-center bg-white text-neutral-500 hover:bg-gray-200 focus:z-10 rounded border-none px-2 py-1"
          aria-label="Note"
          onClick={handleOpen}
        >
          <DocumentTextIcon className="w-5 h-5 text-neutral-500" aria-hidden="true" />
          <span className="ml-2 text-sm">Note</span>
          {open ? (
            <MinusSmallIcon className="ml-2 w-4 h-4 text-neutral-500" aria-hidden="true" />
          ) : (
            <PlusSmallIcon className="ml-2 w-4 h-4 text-neutral-500" aria-hidden="true" />
          )}
        </button>
      </div>
      <ul
        className={`${
          open ? 'visible' : 'invisible'
        } absolute left-0 list-none m-0 mt-4 p-0 shadow-lg border border-solid border-gray-200`}
        style={{ background: '-moz-field' }}
      >
        <li>
          <button
            className="text-left text-sm w-full block px-2 py-1 whitespace-nowrap border-none bg-white hover:bg-gray-200"
            onClick={createNote}
          >
            Create standalone note
          </button>
        </li>
        {items.map(item => {
          const itemTitle = item.title && item.title.length > 64 ? item.title.slice(0, 64) + '...' : item.title
          return (
            <li key={item.id}>
              <button
                className="text-left text-sm w-full block px-2 py-1 whitespace-nowrap border-none bg-white hover:bg-gray-200"
                onClick={() => addNoteToItem(item.id)}
              >
                Add child note to "{itemTitle}"
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
