import React from 'react'
import { Bars3Icon } from '@heroicons/react/20/solid'

interface MenuProps {
  items: {
    label: string
    handleClick: () => void
  }[]
}

export function Menu({ items }: MenuProps) {
  const [open, setOpen] = React.useState(false)

  function handleOpen() {
    setOpen(!open)
  }

  function selectOption(onClick: () => void) {
    onClick()
    setOpen(!open)
  }

  return (
    <div className="fixed top-4 right-6 z-10">
      <div className="relative w-9">
        <button
          onClick={handleOpen}
          className="border-transparent border-solid p-0 rounded-md opacity-50 hover:opacity-90 hover:bg-white"
        >
          <Bars3Icon />
        </button>
      </div>

      <ul
        className={`${
          open ? 'visible' : 'invisible'
        } absolute right-0 list-none bg-white m-0 mt-1 p-0 shadow-md text-s`}
      >
        {items.map(({ label, handleClick }) => {
          return (
            <li key={label}>
              <button
                className="text-left w-full block px-4 py-2 whitespace-nowrap border-none"
                onClick={() => selectOption(handleClick)}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
