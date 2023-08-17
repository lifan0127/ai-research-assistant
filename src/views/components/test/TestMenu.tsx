import React from 'react'
import { WrenchIcon } from '@heroicons/react/24/solid'
import { DropdownMenu } from '../menu/DropdownMenu'
import { Message } from '../../hooks/useMessages'
import { ResearchAssistant } from '../../../models/assistant'
import { useDialog } from '../../hooks/useDialog'
import { searchResultsAction } from './data/searchResults'
import { qaResponseAction } from './data/qaResponse'

const testMessages = [
  {
    type: 'BUTTON' as const,
    label: 'User hello',
    message: { type: 'USER_MESSAGE' as const, content: 'Hello!' },
  },
  {
    type: 'BUTTON' as const,
    label: 'Search ML',
    message: { type: 'USER_MESSAGE' as const, content: 'Find some papers on machine learning.' },
  },
  {
    type: 'BUTTON' as const,
    label: 'Unclear Search',
    message: { type: 'USER_MESSAGE' as const, content: 'Can you help me search for papers?' },
  },
  {
    type: 'BUTTON' as const,
    label: 'QA ML',
    message: { type: 'USER_MESSAGE' as const, content: 'How to use machine learning for materials discovery?' },
  },
  {
    type: 'BUTTON' as const,
    label: 'QA Unknown',
    message: { type: 'USER_MESSAGE' as const, content: 'How to use knowledge graphs in chemistry?' },
  },
  {
    type: 'BUTTON' as const,
    label: 'Summarize',
    message: { type: 'USER_MESSAGE' as const, content: 'Summarize the search results.' },
  },
  // {
  //   type: 'BUTTON' as const,
  //   label: 'Bot lengthy',
  //   message: {
  //     type: 'BOT_MESSAGE' as const,
  //     widget: 'MARKDOWN' as const,
  //     input: {
  //       content:
  //         'This is a new bot message.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.',
  //     },
  //   },
  // },
  {
    type: 'BUTTON' as const,
    label: 'Bot search output',
    message: {
      type: 'BOT_MESSAGE' as const,
      ...searchResultsAction.payload,
      _raw: JSON.stringify(searchResultsAction),
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'Bot QA output',
    message: {
      type: 'BOT_MESSAGE' as const,
      ...qaResponseAction.payload,
      _raw: JSON.stringify(qaResponseAction),
    },
  },
]

interface TestMenuProps {
  setUserInput: (input: { content: string }) => void
  addMessage: (message: Partial<Message>) => void
  assistant: ResearchAssistant
}

export function TestMenu({ setUserInput, addMessage, assistant }: TestMenuProps) {
  const dialog = useDialog()
  const items = [
    ...testMessages.map(({ label, message }) => ({
      type: 'BUTTON' as const,
      label,
      handleClick: () => {
        addMessage(message)
        if (message.type === 'USER_MESSAGE') {
          setUserInput({ content: message.content })
        }
      },
    })),
    {
      type: 'BUTTON' as const,
      label: 'Minimize',
      handleClick: dialog.minimize,
    },
  ]
  return <DropdownMenu Icon={WrenchIcon} position={'top-4 right-16'} items={items} />
}
