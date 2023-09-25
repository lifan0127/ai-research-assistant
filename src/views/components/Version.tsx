import React from 'react'
import { OPENAI_GPT_MODEL } from '../../constants'
import { version } from '../../../package.json'

export function Version() {
  return (
    <div className="text-center w-full text-gray-400 text-sm py-0.5">
      <span>Version: {version}</span> <span>(Model: {OPENAI_GPT_MODEL})</span>
    </div>
  )
}
