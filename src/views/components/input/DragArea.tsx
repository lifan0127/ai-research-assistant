import React, { useState } from 'react'
import { parseDataTransfer } from '../../../models/utils/dataTransfer'
import { ItemInfo } from '../../../apis/zotero/item'
import {
  StateName,
  StateSelection,
  SelectedItem,
  SelectedCollection,
  SelectedImage,
} from '../../../models/utils/states'
import { useDialog } from '../../hooks/useDialog'
import { useDragging } from '../../hooks/useDragging'
import { escapeTitle, MentionValue } from '../../../models/utils/states'

export interface DragAreaProps {
  id?: string
  value: MentionValue
  setValue: (text: MentionValue) => void
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  addSelection: (name: StateName, selections: StateSelection[]) => void
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export function DragArea({ id, value, setValue, onDragEnter, onDragLeave, addSelection, inputRef }: DragAreaProps) {
  const dialog = useDialog()
  const { setIsDragging } = useDragging()
  const [backgroundColor, setBackgroundColor] = useState('bg-white/50')

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    setBackgroundColor('bg-rose-100')
  }

  function handleDrageEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    onDragEnter(event)
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    setBackgroundColor('bg-white/50')
    onDragLeave(event)
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(0)
    setBackgroundColor('bg-white/50')
    const { type, ...data } = await parseDataTransfer(event.dataTransfer)
    switch (type) {
      case 'zotero/item': {
        const { items = [] } = data
        addSelection(
          'items',
          items.map(item => ({ ...item, title: escapeTitle(item.title || '') }))
        )
        break
      }
      case 'zotero/collection': {
        const { collection } = data
        if (collection) {
          addSelection('collections', [
            { ...collection, type: 'collection', title: escapeTitle(collection.title) },
          ] as SelectedCollection[])
        }
        break
      }
      case 'zotero/annotation-image': {
        const { image, libraryID, key } = data
        const id = `${libraryID}/${key}`
        addSelection('images', [{ title: `Figure (${id})`, id, image }] as SelectedImage[])
      }
      case 'text/plain': {
        const { text } = data
        if (text && text !== '') {
          setValue({
            newValue: value.newValue + text,
            newPlainTextValue: value.newPlainTextValue + text,
            mentions: value.mentions,
          })
        }
        break
      }
    }
    dialog.focus()
    inputRef?.current?.focus()
    // console.log({ type, data })
  }

  return (
    <div
      className={`absolute left-0 right-0 top-0 bottom-0 border-3 border-dashed z-50 border-gray-500 text-gray-500 font-bold ${backgroundColor}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnter={handleDrageEnter}
      onDrop={handleDrop}
    >
      <div className={'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ' + (!!id ? 'text-xl' : 'text-3xl')}>
        Drop Area
      </div>
    </div>
  )
}
