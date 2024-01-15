import React, { MouseEvent } from 'react'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

interface ButtonGroupProps {
  groups: {
    key: string
    label: string | JSX.Element
    onClick: () => void
  }[]
  selected?: string
}

export function ButtonGroup({ groups, selected }: ButtonGroupProps) {
  if (groups.length === 0) {
    return null
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>, onClick: () => void) {
    event.preventDefault()
    onClick()
  }

  return (
    <div className="isolate divide-x divide-gray-400 rounded-lg shadow flex w-full sm:w-1/2 md:w-1/3 lg:w-1/4 mx-auto">
      {groups.map(({ key, label, onClick }, index) => {
        return (
          <a
            key={key}
            className={classNames(
              key === selected ? 'text-gray-900 bg-gray-200' : 'text-gray-500 hover:text-gray-700 bg-white',
              index === 0 ? 'rounded-l-lg' : '',
              index === groups.length - 1 ? 'rounded-r-lg' : '',
              'group relative min-w-0 flex-1 overflow-hidden p-1 text-center text-sm font-medium hover:bg-gray-50 focus:bg-gray-50 focus:z-10'
            )}
            onClick={event => handleClick(event, onClick)}
          >
            <span>{label}</span>
          </a>
        )
      })}
    </div>
  )
}
