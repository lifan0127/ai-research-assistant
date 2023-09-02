import React from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { ResearchAssistant } from '../../../models/assistant'
import { useDialog } from '../../hooks/useDialog'
import { DropdownMenu } from './DropdownMenu'

interface MenuProps {
  containerRef: React.RefObject<HTMLDivElement>
  assistant: ResearchAssistant
  clearMessages: () => void
}

export function MainMenu({ containerRef, assistant, clearMessages }: MenuProps) {
  const dialog = useDialog()

  const items = [
    {
      type: 'BUTTON' as const,
      label: dialog.mode === 'NORMAL' ? 'Minimize window' : 'Restore window',
      handleClick: () => {
        dialog.mode === 'NORMAL' ? dialog.minimize() : dialog.restore()
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
          }
        }, 50)
      },
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
  return <DropdownMenu items={items} Icon={Bars3Icon} position="top-4 right-6" />
}
