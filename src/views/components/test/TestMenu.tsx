import React from 'react'
import { WrenchIcon } from '@heroicons/react/24/solid'
import { DropdownMenu } from '../menu/DropdownMenu'
import { Message } from '../message/types'
import { ResearchAssistant } from '../../../models/assistant'
import { useDialog } from '../../hooks/useDialog'
import { searchResultsAction } from './data/searchResults'
import { qaResponseAction } from './data/qaResponse'
import { urlMessageAction } from './data/urlMessage'
import { States, MentionValue } from '../../../models/utils/states'
import { defaultStates } from '../../hooks/useStates'

interface TestMessage {
  type: 'BUTTON'
  label: string
  message: Partial<Message>
}

const testMessages = [
  {
    type: 'BUTTON' as const,
    label: 'User hello',
    message: {
      type: 'USER_MESSAGE' as const,
      content: { newValue: 'Hello!', newPlainTextValue: 'Hello!', mentions: [] },
      states: { ...defaultStates, items: [] },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'Search ML',
    message: {
      type: 'USER_MESSAGE' as const,
      content: {
        newValue: 'Find some papers on machine learning.',
        newPlainTextValue: 'Find some papers on machine learning.',
        mentions: [],
      },
      states: { ...defaultStates, items: [] },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'Unclear Search',
    message: {
      type: 'USER_MESSAGE' as const,
      content: {
        newValue: 'Can you help me search for papers?',
        newPlainTextValue: 'Can you help me search for papers?',
        mentions: [],
      },
      states: { ...defaultStates, items: [] },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'QA ML',
    message: {
      type: 'USER_MESSAGE' as const,
      content: {
        newValue: 'How to use machine learning for materials discovery?',
        newPlainTextValue: 'How to use machine learning for materials discovery?',
        mentions: [],
      },
      states: { ...defaultStates, items: [] },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'Stateful QA',
    message: {
      type: 'USER_MESSAGE' as const,
      content: {
        newValue: 'How to use machine learning for materials discovery?',
        newPlainTextValue: 'How to use machine learning for materials discovery?',
        mentions: [],
      },
      states: { ...defaultStates, items: [242] },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'Collection States for QA',
    message: {
      type: 'USER_MESSAGE' as const,
      content: {
        newValue: 'Why is data accuracy important to R&D?',
        newPlainTextValue: 'Why is data accuracy important to R&D?',
        mentions: [],
      },
      states: {
        ...defaultStates,
        collections: [
          {
            id: 4,
            title: 'Consultancies',
            label: 'Consultancies (26 items)',
          },
        ],
      },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'QA Unknown',
    message: {
      type: 'USER_MESSAGE' as const,
      content: {
        newValue: 'How to use knowledge graphs in chemistry?',
        newPlainTextValue: 'How to use knowledge graphs in chemistry?',
        mentions: [],
      },
      states: { ...defaultStates, items: [] },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'Summarize',
    message: {
      type: 'USER_MESSAGE' as const,
      content: {
        newValue: 'Summarize the search results.',
        newPlainTextValue: 'Summarize the search results.',
        mentions: [],
      },
      states: { ...defaultStates, items: [] },
    },
  },
  {
    type: 'BUTTON' as const,
    label: 'Bot with URL',
    message: {
      type: 'BOT_MESSAGE' as const,
      ...urlMessageAction.payload,
      _raw: JSON.stringify(urlMessageAction),
    },
  },
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
  {
    type: 'BUTTON' as const,
    label: 'Bot Error',
    message: {
      type: 'BOT_MESSAGE',
      widget: 'ERROR',
      input: {
        error: {
          status: 400,
          headers: {},
          attemptNumber: 1,
          retriesLeft: 6,
          name: 'Error',
          message: '400 status code (no body)',
          stack:
            '@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:830:19\n_APIError@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:55850:5\nBadRequestError<@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:55925:11\ngenerate@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:55878:14\nmakeStatusError@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:56603:12\nmakeRequest@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:56643:20\n',
        },
      },
      _raw: JSON.stringify({
        status: 400,
        headers: {},
        attemptNumber: 1,
        retriesLeft: 6,
        name: 'Error',
        message: '400 status code (no body)',
        stack:
          '@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:830:19\\n_APIError@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:55850:5\\nBadRequestError<@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:55925:11\\ngenerate@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:55878:14\\nmakeStatusError@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:56603:12\\nmakeRequest@resource://gre/modules/addons/XPIProvider.jsm -> file:///home/fan/Repos/ai-research-assistant/builds/addon/bootstrap.js -> file:///home/fan/Repos/ai-research-assistant/builds/addon//chrome/content/scripts/index.js:56643:20\\n',
      }),
      id: 'ZT9Rp02st5jhLlhd',
      timestamp: '2023-12-14T19:36:21.176Z',
    },
  },
]

interface TestMenuProps {
  setUserInput: (input: { content: MentionValue; states: States }) => void
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
          setUserInput({ content: message.content, states: message.states })
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
