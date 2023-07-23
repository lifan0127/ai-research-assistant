import React from 'react'
import { config, version } from '../../../package.json'

export function Header() {
  return (
    <header className="w-full flex flex-row text-neutral-500">
      <div className="w-1/6 mr-6">
        <img className="max-w-full" src={`chrome://${config.addonRef}/content/icons/favicon@4x.png`} alt="Aria Logo" />
      </div>
      <div>
        <h2 className="m-0 mt-3 p-0 text-3xl">A.R.I.A. (Aria)</h2>
        <div className="m-0 p-0 text-sm">Your AI Research Assistant</div>
        <div>
          QA Assistant analyzes and understands the content of your Zotero library. It can help streamline your research
          process by performing automatic literature search, summarization, and question & answer
        </div>
      </div>
    </header>
  )
}
