import React from 'react'
import { MagnifyingGlassIcon, QuestionMarkCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface PromptLibraryProps {}

const prompts = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Search in Zotero',
    description: 'Search your Zotero library for papers, notes, and more.',
  },
  {
    icon: QuestionMarkCircleIcon,
    title: 'Ask a question',
    description: 'Ask a question and find answer based on your Zotero library.',
  },
  {
    icon: PhotoIcon,
    title: 'Vision Analysis',
    description: 'Create an image annotation and ask questions about it.',
  },
]

export function PromptLibrary({}: PromptLibraryProps) {
  function handleClick() {}
  return (
    <div className="p-4">
      <p className="mb-6">For some ideas, try one of the suggestions below...</p>
      <ul role="list" className="list-none p-0 grid grid-cols-1 -m-2 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.map(({ icon: Icon, title, description }) => (
          <li key={title} className="m-2 col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
            <button
              type="button"
              className="w-full h-full p-4 bg-white hover:bg-gray-200 focus:z-10 rounded border-none"
              onClick={handleClick}
            >
              <div className="flex items-center mb-3">
                <Icon className="w-5 h-5" />
                <span className="ml-2 text-md font-bold text-gray-900">{title}</span>
              </div>
              <div className="h-full text-sm font-median text-gray-500">{description}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
