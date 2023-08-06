import React, { useRef, useEffect } from 'react'

export function useOutsideClick(callback: () => void) {
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !(ref.current as any).contains(event.target)) {
        callback()
      }
    }

    document.addEventListener('click', handleClick, true)
    addon.data.popup.window!.addEventListener('click', handleClick, true)
    return () => {
      document.documentElement.removeEventListener('click', handleClick, true)
      addon.data.popup.window!.removeEventListener('click', handleClick, true)
    }
  }, [])

  return ref
}
