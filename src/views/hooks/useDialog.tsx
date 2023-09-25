import React, { useState, createContext, useContext, useMemo } from 'react'

type DialogContextType = {
  mode: 'NORMAL' | 'MINIMAL'
  setMode: (mode: 'NORMAL' | 'MINIMAL') => void
}

export const DialogContext = createContext<DialogContextType>({
  mode: 'NORMAL' as const,
  setMode: mode => {},
})

interface DialogContextProviderProps {
  children: React.ReactNode
}

export function DialogContextProvider({ children }: DialogContextProviderProps) {
  const [mode, setMode] = useState<'NORMAL' | 'MINIMAL'>('NORMAL')
  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
    }),
    [mode]
  )
  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>
}

export function useDialog() {
  const dialog = addon.data.popup.window as Window
  const mainWindow = Zotero.getMainWindow()
  const { mode, setMode } = useContext(DialogContext)

  function minimize() {
    setMode('MINIMAL')

    const dialogWidth = 420
    const dialogHeight = 560
    dialog.resizeTo(dialogWidth, dialogHeight)

    // Determine the coordinates for the lower right corner with 20-pixel margin
    const left = mainWindow.screenX + mainWindow.innerWidth - dialog.outerWidth - 20
    const top = mainWindow.screenY + mainWindow.innerHeight - dialog.outerHeight - 20
    setTimeout(() => dialog.moveTo(left, top), 0) // To prevent flickering
  }

  function restore() {
    setMode('NORMAL')

    const dialogWidth = Math.max(mainWindow.outerWidth * 0.6, 720)
    const dialogHeight = mainWindow.outerHeight * 0.8
    dialog.resizeTo(dialogWidth, dialogHeight)

    const left = mainWindow.screenX + mainWindow.outerWidth / 2 - dialogWidth / 2
    const top = mainWindow.screenY + mainWindow.outerHeight / 2 - dialogHeight / 2
    setTimeout(() => dialog.moveTo(left, top), 0)
  }

  function close() {
    dialog.close()
  }

  function focus() {
    dialog.focus()
  }

  return { mode, minimize, restore, close, focus }
}
