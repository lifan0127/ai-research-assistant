import React from 'react'
import { version, config } from '../../../package.json'

export function Version() {
  const OPENAI_MODEL = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || 'gpt-4-1106-preview'

  return (
    <div className="text-center w-full text-gray-400 text-sm py-0.5">
      <span>Version: {version}</span> <span>(Model: {OPENAI_MODEL})</span>
    </div>
  )
}
