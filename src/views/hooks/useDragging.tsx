import React, { useState, createContext, useContext, useMemo } from 'react'

type DraggingContextType = {
  isDragging: number
  setIsDragging: (isDragging: number) => void
  dropArea: string | undefined
  setDropArea: (dropArea: string | undefined) => void
}

export const DraggingContext = createContext<DraggingContextType>({
  isDragging: 0,
  setIsDragging: isDragging => {},
  dropArea: undefined,
  setDropArea: dropArea => {},
})

interface DragContextProviderProps {
  children: React.ReactNode
}

export function DraggingContextProvider({ children }: DragContextProviderProps) {
  const [isDragging, setIsDragging] = useState<number>(0)
  const [dropArea, setDropArea] = useState<string>()
  const contextValue = useMemo(
    () => ({
      isDragging,
      setIsDragging,
      dropArea,
      setDropArea,
    }),
    [isDragging, dropArea]
  )

  return <DraggingContext.Provider value={contextValue}>{children}</DraggingContext.Provider>
}

export function useDragging() {
  const { isDragging, setIsDragging, dropArea, setDropArea } = useContext(DraggingContext)

  return { isDragging, setIsDragging, dropArea, setDropArea }
}
