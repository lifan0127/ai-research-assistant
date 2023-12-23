import React from 'react'
import { marked } from 'marked'
import { BotMessageProps } from '../message/types'
import { Square2StackIcon } from '@heroicons/react/24/outline'
import { copyButtonDef } from './types'

interface CopyButtonProps extends copyButtonDef {
  copyId: BotMessageProps['copyId']
  setCopyId: BotMessageProps['setCopyId']
  id: BotMessageProps['id']
  input: BotMessageProps['input']
}

export function CopyButton({ copyId, setCopyId, id, utils, input }: CopyButtonProps) {
  function handleCopy() {
    utils.copy(input)
    setCopyId(id)
  }
  return (
    <div className="rounded border border-solid border-neutral-300">
      <button
        type="button"
        className="relative inline-flex items-center bg-white text-neutral-500 hover:bg-gray-200 focus:z-10 rounded border-none px-2 py-1"
        aria-label="Copy"
        onClick={handleCopy}
      >
        <Square2StackIcon className="w-5 h-5 text-neutral-500" aria-hidden="true" />
        <span className="ml-2 text-sm">{copyId === id ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  )
}
