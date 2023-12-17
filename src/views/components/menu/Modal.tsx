import React, { useRef } from 'react'

interface ModalProps {
  children: React.ReactNode
}

export function Modal({ children }: ModalProps) {
  return (
    <div className="fixed left-0 top-0 w-full h-full z-10">
      <div className="inset-0 z-10 w-full h-full overflow-y-auto">
        <div className="flex min-h-full justify-center text-center items-center p-0">
          <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-[6px_6px_24px_3px_rgba(0,0,0,0.3)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
