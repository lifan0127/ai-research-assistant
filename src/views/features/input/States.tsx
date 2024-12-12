import React from 'react'
import { XCircleIcon } from '@heroicons/react/24/outline'
import { SelectionIcon } from '../../icons/zotero'
import { States, SelectedImage, StateName, selectionConfig } from '../../../models/utils/states'
import { useStates } from '../../hooks/useStates'

interface ChipProps {
  children: React.ReactNode
  onDelete: () => void
  name: StateName
}

function Chip({ children, onDelete, name }: ChipProps) {
  const backgroundColor = selectionConfig[name].backgroundColor
  return (
    <div
      className="flex flex-initial mx-0 sm:mx-1 border-none cursor-default outline-none h-8 leading-8 rounded-xl px-2 align-middle mb-2 max-w-[100%] md:max-w-[22%] sm:max-w-[30%]"
      style={{ backgroundColor }}
    >
      {children}
      <span className="w-6 h-6 my-1 flex-none">
        <XCircleIcon onClick={onDelete} className="text-gray-400 hover:text-black" />
      </span>
    </div>
  )
}

function SelectionContainer({ states, name }: { states: ReturnType<typeof useStates>; name: StateName }) {
  const selections = states.states[name]
  if (selections.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap mx-0 sm:-mx-1 items-center justify-start flex-1 text-black text-sm w-[calc(100%-12px)] sm:w-full space-x-1">
      <span className="capitalize w-full sm:w-auto sm:h-8 sm:leading-8 mb-0 sm:mb-2 sm:mx-1 mx-0">{name}</span>
      {selections.map(selection => {
        const { id, type, title } = selection
        return name === 'images' ? (
          <div key={id} className="relative border border-solid border-neutral-300">
            <div className="h-6 flex flex-row px-1" style={{ backgroundColor: selectionConfig[name].backgroundColor }}>
              <div className="flex-none text-sm text-black">{id}</div>
              <div className="grow"></div>
              <div className="flex-none w-6 h-6">
                <XCircleIcon
                  onClick={() => states.remove(name, selection)}
                  className="text-gray-400 hover:text-black"
                />
              </div>
            </div>
            <div className="h-40">
              <img
                className="max-h-full max-w-full aspect-auto"
                src={(selection as SelectedImage).image}
                title={title}
              />
            </div>
          </div>
        ) : (
          <Chip key={id} onDelete={() => states.remove(name, selection)} name={name}>
            <span className="flex-none">
              <SelectionIcon name={name} key={id} type={type} />
            </span>
            <span className="px-1 truncate flex-auto">{title}</span>
          </Chip>
        )
      })}
      {selections.length > 2 && (
        <span
          className="w-full sm:w-auto sm:h-8 sm:leading-8 mb-2 sm:mx-1 mx-0 text-gray-500 hover:text-tomato text-right sm:text-left"
          onClick={() => states.removeAll(name)}
        >
          Remove all {name}
        </span>
      )}
    </div>
  )
}

interface StatesProps {
  states: ReturnType<typeof useStates>
}

export function States({ states }: StatesProps) {
  const stateNames: StateName[] = ['creators', 'tags', 'items', 'collections', 'images']
  return (
    <div>
      {stateNames.map(name => (
        <SelectionContainer key={name} states={states} name={name} />
      ))}
    </div>
  )
}
