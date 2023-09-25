import React from 'react'
import { Container } from './Container'
import { DialogContextProvider } from './hooks/useDialog'
import { DraggingContextProvider } from './hooks/useDragging'

export function Providers(props: any, ref: any) {
  return (
    <DialogContextProvider>
      <DraggingContextProvider>
        <Container />
      </DraggingContextProvider>
    </DialogContextProvider>
  )
}
