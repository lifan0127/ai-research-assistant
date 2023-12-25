import React, { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/20/solid'
import { ResearchAssistant } from '../../../models/assistant'
import { useDialog } from '../../hooks/useDialog'
import { DropdownMenu } from './DropdownMenu'
import { Confirmation } from '../Confirmation'
import { chatHistoryToNote } from '../output/chatHistory'
import { Message } from '../message/types'
import { useDragging } from '../../hooks/useDragging'

interface ScaleButtonGroupProps {
  scale: number
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

function ScaleButtonGroup({ scale, zoomIn, zoomOut, reset }: ScaleButtonGroupProps) {
  return (
    <div className="px-4 py-2 flex flex-row">
      <div>Zoom:</div>
      <div className="h-5 inline-flex rounded-md shadow-sm">
        <MinusCircleIcon className="opacity-50 hover:opacity-90" onClick={zoomOut} />
        <span className="text-center">{scale.toFixed(2)}</span>
        <PlusCircleIcon className="opacity-50 hover:opacity-90" onClick={zoomIn} />
      </div>
    </div>
  )
}

interface MenuProps {
  containerRef: React.RefObject<HTMLDivElement>
  assistant: ResearchAssistant
  clearMessages: () => void
  messages: Message[]
  scale: number
  setScale: (scale: number) => void
}

export function MainMenu({ containerRef, assistant, clearMessages, messages, scale, setScale }: MenuProps) {
  const dialog = useDialog()
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState<React.ReactNode | undefined>(undefined)
  const [confirmationCallback, setConfirmationCallback] = useState<(() => void) | undefined>(undefined)
  const { setDropArea } = useDragging()

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
      type: 'COMPONENT' as const,
      label: 'Zoom',
      Component: ScaleButtonGroup,
      props: {
        scale,
        zoomIn: () => setScale(scale + 25),
        zoomOut: () => setScale(scale - 25),
        reset: () => setScale(1),
      },
    },
    {
      type: 'SEPARATOR' as const,
      label: 'Separator 1',
    },
    {
      type: 'BUTTON' as const,
      label: 'Save chat history',
      disabled: messages.length === 0,
      handleClick: async () => await chatHistoryToNote(messages),
    },
    {
      type: 'BUTTON' as const,
      label: 'Clear chat history',
      disabled: messages.length === 0,
      handleClick: () => {
        setConfirmationOpen(true)
        setConfirmationMessage(<div className="py-4">This will delete your current chat history. Continue?</div>)
        setConfirmationCallback(() => () => {
          clearMessages()
          assistant.resetMemory()
        })
        setDropArea(undefined)
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
  return (
    <>
      <DropdownMenu items={items} Icon={Bars3Icon} position="top-4 right-6" />
      <Confirmation
        message={confirmationMessage}
        open={confirmationOpen}
        setOpen={setConfirmationOpen}
        callback={confirmationCallback}
      />
    </>
  )
}
