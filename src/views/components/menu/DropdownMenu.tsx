import React, { Fragment, useState } from 'react'
import { useOutsideClick } from '../../hooks/useOutsideClick'

interface ButtonItem {
  type: 'BUTTON'
  label: string
  handleClick: () => void
}

interface ComponentItem {
  type: 'COMPONENT'
  label: string
  component: React.FC | JSX.Element
}

interface DropdownMenuProps {
  items: (ButtonItem | ComponentItem)[]
  Icon: any
  position: string
}

export function DropdownMenu({ Icon, position, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false))

  return (
    <div className={`fixed ${position} z-10`}>
      <div className="relative w-9">
        <button
          ref={ref}
          onClick={() => setOpen(!open)}
          className="border-transparent border-solid p-0 rounded-md opacity-50 hover:opacity-90 hover:bg-white"
        >
          <Icon />
        </button>
      </div>

      <ul
        className={`${
          open ? 'visible' : 'invisible'
        } absolute right-0 list-none bg-white m-0 mt-1 p-0 shadow-md text-s`}
      >
        {items.map(items => {
          switch (items.type) {
            case 'BUTTON': {
              const { label, handleClick } = items
              return (
                <li key={label}>
                  <button
                    className="text-left w-full block px-4 py-2 whitespace-nowrap border-none"
                    onClick={handleClick}
                  >
                    {label}
                  </button>
                </li>
              )
            }
            case 'COMPONENT': {
              const { label, component } = items
              return <Fragment key={label}>{component}</Fragment>
            }
          }
        })}
      </ul>
    </div>
  )
}
