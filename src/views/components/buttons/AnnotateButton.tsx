import React, { useState } from 'react'
import { PencilSquareIcon, PlusSmallIcon, MinusSmallIcon } from '@heroicons/react/24/outline'
import { BotMessageProps, UserMessageProps } from '../message/types'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { annotationButtonDef } from './types'
import { updateAnnotation } from '../../../apis/zotero'

interface AnnotateButtonProps extends annotationButtonDef {
  input: BotMessageProps['input']
  states?: UserMessageProps['states']
}

export function AnnotateButton({ utils, input, states }: AnnotateButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false))
  const annotations = states?.images ?? []

  function handleOpen() {
    setOpen(!open)
  }

  async function annotate(annotationId: string) {
    const [libraryID, key] = annotationId.split('/')
    const annotation = (await Zotero.Items.getByLibraryAndKeyAsync(parseInt(libraryID), key)) as Zotero.DataObject
    const content = utils.createAnnotation(input)
    updateAnnotation(annotation.id, content)
  }

  if (annotations.length === 0) {
    return null
  }

  // if (annotations.length === 1) {
  //   return (
  //     <div className="relative">
  //       <div className="rounded border border-solid border-neutral-300">
  //         <button
  //           ref={ref}
  //           type="button"
  //           className="relative inline-flex items-center bg-white text-neutral-500 hover:bg-gray-200 focus:z-10 rounded border-none px-2 py-1"
  //           aria-label="Annotation"
  //           onClick={() => annotate(annotations[0].id as string)}
  //         >
  //           <PencilSquareIcon className="w-5 h-5 text-neutral-500" aria-hidden="true" />
  //           <span className="ml-2 text-sm">Annotate</span>
  //         </button>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="relative">
      <div className="rounded border border-solid border-neutral-300">
        <button
          ref={ref}
          type="button"
          className="relative inline-flex items-center bg-white text-neutral-500 hover:bg-gray-200 focus:z-10 rounded border-none px-2 py-1"
          aria-label="Annotation"
          onClick={handleOpen}
        >
          <PencilSquareIcon className="w-5 h-5 text-neutral-500" aria-hidden="true" />
          <span className="ml-2 text-sm">Annotate</span>
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
        {annotations.map(item => {
          console.log({ item })
          return (
            <li key={item.id}>
              <button
                className="text-left text-sm w-full block px-2 py-1 whitespace-nowrap border-none bg-white hover:bg-gray-200"
                onClick={() => annotate(item.id)}
              >
                Add annotation to "{item.id}"
              </button>
              <div className="h-20 p-1">
                <img className="h-full aspect-auto" src={item.image} title={item.id} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
