import React from 'react'
import { MagnifyingGlassIcon, QuestionMarkCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface PromptLibraryProps {
  setPromptTemplate: (template: string) => void
}

const prompts = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Search in Zotero',
    template: 'Search for papers related to # in Zotero.',
  },
  {
    icon: QuestionMarkCircleIcon,
    title: 'Ask a question',
    template: 'Summarize / in 2-3 sentences.',
  },
  {
    icon: PhotoIcon,
    title: 'Vision Analysis',
    template: 'How do I perform vision analysis on figures and plots?',
  },
]

export function PromptLibrary({ setPromptTemplate }: PromptLibraryProps) {
  return (
    <div className="p-4">
      <p className="mb-6">For some ideas, try one of the suggestions below...</p>
      <ul role="list" className="list-none p-0 grid grid-cols-1 -m-2 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.map(({ icon: Icon, title, template }) => (
          <li key={title} className="m-2 col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
            <button
              type="button"
              className="w-full h-full p-4 bg-white hover:bg-gray-200 focus:z-10 rounded border-none"
              onClick={() => setPromptTemplate(template)}
            >
              <div className="flex mb-3">
                <Icon className="w-5 h-5 text-tomato" />
                <span className="ml-2 text-md font-bold text-gray-900">{title}</span>
              </div>
              <div className="h-full text-left text-sm font-median text-gray-500">{template}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function parsePromptTemplate(template: string, prefixes: string) {
  const regex = new RegExp(`[${prefixes.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]\\s`)
  const match = template.match(regex)
  if (match) {
    return {
      prefix: match[0][0],
      position: (match.index as number) + 1,
    }
  } else {
    return null // or however you wish to handle no match found
  }
}
