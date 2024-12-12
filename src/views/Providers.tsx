import React from "react"
import { Container } from "./Container"
import { DialogContextProvider } from "./hooks/useDialog"
import { DraggingContextProvider } from "./hooks/useDragging"
import { AssistantContextProvider } from "./hooks/useAssistant"

export function Providers(props: any, ref: any) {
  return (
    <DialogContextProvider>
      <DraggingContextProvider>
        <AssistantContextProvider>
          <Container />
        </AssistantContextProvider>
      </DraggingContextProvider>
    </DialogContextProvider>
  )
}
