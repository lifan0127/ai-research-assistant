import React, { forwardRef } from 'react'
import { isEmpty } from 'lodash'

interface LinkButtonProps {
  style?: string
  onClick: () => void
  children: JSX.Element | JSX.Element[]
}

type Ref = HTMLAnchorElement | null

export const LinkButton = forwardRef<Ref, LinkButtonProps>(
  (
    { style = 'border-none bg-transparent m-0 p-0 text-black hover:text-tomato focus:text-tomato', onClick, children },
    ref
  ) => {
    function handleClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
      event.preventDefault()
      onClick()
    }

    return (
      <a ref={ref} href="#" onClick={handleClick} className={style}>
        {children}
      </a>
    )
  }
)
