import React, { useState } from 'react'

export function useDialogControl() {
  const [mode, setMode] = useState<'NORMAL' | 'MINIMAL'>('NORMAL')
  const dialog = addon.data.popup.window as Window
  const mainWindow = Zotero.getMainWindow()

  function minimize() {
    setMode('MINIMAL')

    const dialogWidth = 420
    const dialogHeight = 640
    dialog.resizeTo(dialogWidth, dialogHeight)

    // Determine the coordinates for the lower right corner with 20-pixel margin
    const left = mainWindow.screenX + mainWindow.innerWidth - dialog.outerWidth - 20
    const top = mainWindow.screenY + mainWindow.innerHeight - dialog.outerHeight - 20
    setTimeout(() => dialog.moveTo(left, top), 0)
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

  return { mode, minimize, restore, close }
}
