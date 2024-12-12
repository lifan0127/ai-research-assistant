import React, { useMemo, createContext, useContext } from "react"
import { ResearchAssistant } from "../../models/assistant"
import { getPref } from "../../utils/prefs"

interface AssistantContextType {
  assistant: ResearchAssistant
}

const AssistantContext = createContext<AssistantContextType | undefined>(
  undefined,
)

interface AssistantProviderProps {
  children: React.ReactNode
}

export const AssistantContextProvider: React.FC<AssistantProviderProps> = ({
  children,
}) => {
  const assistant = useMemo(
    () =>
      new ResearchAssistant({
        assistants: {
          routing: getPref("ASSISTANT_ROUTING") as string,
          file: getPref("ASSISTANT_FILE") as string,
        },
        models: {
          default: "gpt-4o-2024-08-06",
        },
        messageStore: addon.data.popup.messageStore,
      }),
    [],
  )

  return (
    <AssistantContext.Provider value={{ assistant }}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error("useAssistant must be used within an AssistantProvider")
  }
  return context
}
