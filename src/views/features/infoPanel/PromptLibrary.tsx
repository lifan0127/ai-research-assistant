import React, { Fragment, useMemo } from 'react'
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  PhotoIcon,
  AcademicCapIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'
import { selectionConfig } from '../../../models/utils/states'

const prompts = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Search your library',
    template: `Show me the papers related to # since ${new Date().getFullYear() - 1}.`,
  },
  {
    icon: QuestionMarkCircleIcon,
    title: 'Ask a question',
    template: 'Summarize / in a few sentences.',
  },
  {
    icon: AcademicCapIcon,
    title: 'Analyse a researcher',
    template: 'What are the research areas of @?',
  },
  {
    icon: ArrowsRightLeftIcon,
    title: 'Compare two papers',
    template: 'Compare / and / in 2-3 sentences.',
  },
]

const selectionMap: { [key: string]: { label: string; prefix: string; backgroundColor: string } } = Object.values(
  selectionConfig
).reduce(
  (all, { label, prefix, backgroundColor }) => ({
    ...all,
    [prefix]: { label: label.singular, prefix, backgroundColor },
  }),
  {}
)

export const prefixes = Object.values(selectionConfig)
  .map(({ prefix }) => prefix)
  .join('')

interface TemplateProps {
  template: string
}

function Template({ template }: TemplateProps) {
  const transformedTemplate = useMemo(() => {
    const regex = new RegExp(`[${prefixes.replace(/[.*+?^${}()|[\]]/g, '\\$&')}][^[]`, 'g')
    let match
    let lastIndex = -1
    let output: (string | JSX.Element)[] = []
    while ((match = regex.exec(template))) {
      let currentIndex = match.index
      output.push(
        <Fragment key={`text-${lastIndex}-${currentIndex}`}>{template.substring(lastIndex, currentIndex)}</Fragment>
      )
      const { label, prefix, backgroundColor } = selectionMap[template[currentIndex]] || {
        label: 'unknown',
        prefix: template[currentIndex],
        backgroundColor: '#ffc',
      }
      output.push(
        <span key={`prefix-${currentIndex}`} className="px-1 rounded" style={{ backgroundColor }}>
          {prefix}
          {label}
        </span>
      )
      lastIndex = currentIndex + 1
    }
    output.push(
      <Fragment key={`text-${lastIndex}-${template.length}`}>{template.substring(lastIndex, template.length)}</Fragment>
    )
    return <div>{output}</div>
  }, [template])

  return <div className="h-full text-left text-md text-gray-500">{transformedTemplate}</div>
}

interface PromptLibraryProps {
  setPromptTemplate: (template: { template: string } | undefined) => void
}

export function PromptLibrary({ setPromptTemplate }: PromptLibraryProps) {
  return (
    <div>
      <ul role="list" className="list-none p-0 grid grid-cols-1 -m-2 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.map(({ icon: Icon, title, template }) => (
          <li key={title} className="m-2 col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
            <button
              type="button"
              className="w-full h-full p-4 bg-white hover:bg-gray-200 focus:z-10 rounded border-none"
              onClick={() => setPromptTemplate({ template })}
            >
              <div className="flex mb-3">
                <Icon className="w-5 h-5 text-tomato" />
                <span className="ml-2 text-md font-bold text-gray-900">{title}</span>
              </div>
              <Template template={template} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function parsePromptTemplate(prompt: string, prefixes: string, selectionStart?: number, selectionEnd?: number) {
  const regex = new RegExp(`[${prefixes.replace(/[.*+?^${}()|[\]]/g, '\\$&')}][^[]`)
  const match = prompt.match(regex)
  if (match) {
    const prefix = match[0][0]
    const matchIndex = match.index as number
    const query =
      selectionStart === undefined || selectionEnd === undefined
        ? ''
        : selectionStart === selectionEnd
        ? prompt.slice(matchIndex + 1, selectionStart)
        : prompt.slice(selectionStart, selectionEnd + 1)
    const position = selectionEnd ? Math.max(selectionEnd, matchIndex + 1) : matchIndex + 1
    return { prefix, query, position }
  } else {
    return null
  }
}
