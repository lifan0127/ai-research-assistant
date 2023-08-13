import React from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { ResearchAssistant } from '../../../models/assistant'
import { Menu } from './Menu'

interface MenuProps {
  assistant: ResearchAssistant
  clearMessages: () => void
}

export function MainMenu({ assistant, clearMessages }: MenuProps) {
  function minimize() {
    const dialog = addon.data.popup.window as Window
    dialog.resizeTo(420, 640)

    // Determine the coordinates for the lower right corner with 20-pixel margin
    const mainWindow = Zotero.getMainWindow()
    const x = mainWindow.screenX + mainWindow.innerWidth - dialog.outerWidth - 20
    const y = mainWindow.screenY + mainWindow.innerHeight - dialog.outerHeight - 20
    setTimeout(() => dialog.moveTo(x, y), 0)
  }

  const items = [
    {
      type: 'BUTTON' as const,
      label: 'Minimize window',
      handleClick: minimize,
    },
    {
      type: 'BUTTON' as const,
      label: 'Clear chat history',
      handleClick: () => {
        clearMessages()
        assistant.resetMemory()
      },
    },
    {
      type: 'BUTTON' as const,
      label: 'Feedback',
      handleClick: () => {
        Zotero.launchURL(`https://github.com/lifan0127/ai-research-assistant/issues`)
      },
    },
    {
      type: 'BUTTON' as const,
      label: 'Close',
      handleClick: () => {
        const dialog = addon.data.popup.window as Window
        dialog.close()
      },
    },
  ]
  return <Menu items={items} Icon={Bars3Icon} position="top-4 right-6" />
}
