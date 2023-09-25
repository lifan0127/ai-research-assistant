import React from 'react'
import { XCircleIcon } from '@heroicons/react/24/outline'
import { ItemIcon, CollectionIcon } from '../../icons/zotero'
import { States } from '../../../models/utils/states'

interface ChipProps {
  children: React.ReactNode
  onDelete: () => void
}

function Chip({ children, onDelete }: ChipProps) {
  return (
    <div className="flex flex-initial mx-0 sm:mx-1 bg-rose-100 border-none cursor-default outline-none h-8 leading-8 rounded-xl px-2 align-middle mb-2 max-w-[100%] md:max-w-[30%] sm:max-w-[40%]">
      {children}
      <span className="w-6 h-6 my-1 flex-none">
        <XCircleIcon onClick={onDelete} className="text-gray-400 hover:text-black" />
      </span>
    </div>
  )
}

function StatesContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap mx-0 sm:-mx-1 items-center justify-start flex-1 text-black text-sm w-[calc(100%-12px)] sm:w-full">
      {children}
    </div>
  )
}

interface StatesProps {
  states: States
  removeSelectedItem: (itemId: number) => void
  removeAllSelectedItems: () => void
  removeSelectedCollection: () => void
}

export function States({ states, removeSelectedItem, removeAllSelectedItems, removeSelectedCollection }: StatesProps) {
  if (states.selectedItems && states.selectedItems.length > 0) {
    return (
      <StatesContainer>
        <span className="w-full sm:w-auto sm:h-8 sm:leading-8 mb-0 sm:mb-2 sm:mx-1 mx-0">Items:</span>
        {states.selectedItems.map(({ id, type, title }) => {
          return (
            <Chip key={id} onDelete={() => removeSelectedItem(id)}>
              <span className="flex-none">
                <ItemIcon key={id} type={type} />
              </span>
              <span className="px-1 truncate flex-auto">{title}</span>
            </Chip>
          )
        })}
        {states.selectedItems.length > 2 && (
          <span
            className="w-full sm:w-auto sm:h-8 sm:leading-8 mb-2 sm:mx-1 mx-0 text-gray-500 hover:text-tomato text-right sm:text-left"
            onClick={() => removeAllSelectedItems()}
          >
            Remove all
          </span>
        )}
      </StatesContainer>
    )
  } else if (states.selectedCollection) {
    const { label } = states.selectedCollection
    return (
      <StatesContainer>
        <span className="w-full sm:w-auto sm:h-8 sm:leading-8 mb-0 sm:mb-2 sm:mx-1 mx-0">Collection:</span>
        <Chip onDelete={() => removeSelectedCollection()}>
          <span className="flex-none">
            <CollectionIcon />
          </span>
          <span className="px-1 truncate flex-auto">{label}</span>
        </Chip>
      </StatesContainer>
    )
  } else {
    return null
  }
}
