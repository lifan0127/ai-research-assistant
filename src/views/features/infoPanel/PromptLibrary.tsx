import React, { Fragment, useMemo, useState } from 'react'
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  PhotoIcon,
  AcademicCapIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import { selectionConfig } from '../../../models/utils/states'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { LinkButton } from '../../components/buttons/LinkButton'

const prompts = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Search your library',
    template: `Show me the papers related to # since ${new Date().getFullYear() - 1}.`,
  },
  {
    icon: QuestionMarkCircleIcon,
    title: 'Ask a question',
    template: 'According to ^, what are the latest studies on #?',
  },
  {
    icon: ListBulletIcon,
    title: 'Summarize a paper',
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
  )
}

interface PromptListProps {
  displayButtons: boolean
  setPromptTemplate: (template: { template: string } | undefined) => void
}

export function PromptList({ displayButtons, setPromptTemplate }: PromptListProps) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false))

  function handleOpen() {
    setOpen(!open)
  }

  function handleSelect(template: string) {
    setPromptTemplate({ template })
    setOpen(false)
  }

  return (
    <div className="relative">
      <LinkButton
        ref={ref}
        style="relative inline-flex items-center border-none bg-transparent m-0 p-1 rounded-full text-neutral-500 hover:bg-gray-200"
        onClick={handleOpen}
      >
        <SparklesIcon className={displayButtons ? 'w-4 h-4' : 'w-6 h-6'} />
      </LinkButton>
      <div className={open ? 'visible absolute left-0 bottom-10' : 'invisible absolute left-0 bottom-10 '}>
        <ul
          className="list-none m-0 p-0 shadow-lg border border-solid border-gray-200"
          style={{ background: '-moz-field', width: '350px' }}
        >
          {prompts.map(({ icon: Icon, title, template }) => (
            <li key={title} className="relative rounded-lg bg-white">
              <LinkButton
                style="w-full h-full p-4 bg-white hover:bg-gray-200 focus:z-10 rounded border-none flex flex-row"
                onClick={() => handleSelect(template)}
              >
                <Icon className="w-4 h-4 text-tomato mt-1 mr-2" />
                <div className="grow">
                  <Template template={template} />
                </div>
              </LinkButton>
            </li>
          ))}
        </ul>
      </div>
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
