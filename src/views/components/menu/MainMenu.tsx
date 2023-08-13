import React from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { ResearchAssistant } from '../../../models/assistant'
import { useDialogControl } from '../../hooks/useDialogControl'
import { Menu } from './Menu'

interface MenuProps {
  assistant: ResearchAssistant
  dialog: ReturnType<typeof useDialogControl>
  clearMessages: () => void
}

export function MainMenu({ assistant, dialog, clearMessages }: MenuProps) {
  const items = [
    {
      type: 'BUTTON' as const,
      label: dialog.mode === 'NORMAL' ? 'Minimize window' : 'Restore window',
      handleClick: dialog.mode === 'NORMAL' ? dialog.minimize : dialog.restore,
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
        dialog.close()
      },
    },
  ]
  return <Menu items={items} Icon={Bars3Icon} position="top-4 right-6" />
}
