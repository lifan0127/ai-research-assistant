import React, { useState } from 'react'
import { parseDataTransfer } from '../../../models/utils/dataTransfer'
import { ItemInfo } from '../../../models/utils/zotero'
import { SelectedCollection, SelectedItem } from '../../../models/utils/states'
import { useDialog } from '../../hooks/useDialog'
import { useDragging } from '../../hooks/useDragging'

export interface DragAreaProps {
  id?: string
  setDropText: (text: string) => void
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  addSelectedItems: (items: SelectedItem[]) => void
  setSelectedCollection: (collection: SelectedCollection) => void
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export function DragArea({
  id,
  setDropText,
  onDragEnter,
  onDragLeave,
  addSelectedItems,
  setSelectedCollection,
  inputRef,
}: DragAreaProps) {
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
        const { items } = data
        addSelectedItems(items as ItemInfo[])
        break
      }
      case 'zotero/collection': {
        const { collection } = data
        setSelectedCollection(collection as { id: number; label: string })
        break
      }
      case 'text/plain': {
        const { text } = data
        if (text && text !== '') {
          setDropText(text as string)
        }
        break
      }
    }
    dialog.focus()
    inputRef?.current?.focus()
    console.log({ type, data })
    // switch(item.type) {
    //   case 'text/plain': {

    //   }
    // }
  }

  return (
    // <div
    //   className={`fixed m-1 bottom-0 left-0 right-0 w-[calc(100%-20px)] min-h-32 h-1/3 border-4 border-dashed z-50 ${borderColor} rounded-lg ${textColor} text-4xl font-bold bg-white/50`}
    //   onDragOver={handleDragOver}
    //   onDragLeave={handleDragLeave}
    //   onDragEnter={handleDrageEnter}
    //   onDrop={handleDrop}
    // >
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
