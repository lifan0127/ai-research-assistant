import React from 'react'

interface NoficationProps {
  notification?: JSX.Element
}

export function Notification({ notification }: NoficationProps) {
  if (!notification) return null

  return (
    <div className={'w-full bg-red-400 text-black px-4 py-2 -mx-3 text-center z-10'}>
      {notification}
    </div>
  )
}