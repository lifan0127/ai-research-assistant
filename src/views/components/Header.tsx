import React from 'react'
import { config, version } from '../../../package.json'

export function Header() {
  return (
    <header className="w-full flex flex-row text-neutral-500 pt-2">
      <div className="w-16 md:w-48 sm:w-24 mr-6">
        <img className="max-w-full" src={`chrome://${config.addonRef}/content/icons/favicon@4x.png`} alt="Aria Logo" />
      </div>
      <div>
        <h2 className="m-0 my-1 md:my-3 p-0 md:text-5xl sm:text-2xl text-tomato tracking-wider">
          A.R.I.A. <span className="md:text-3xl sm:text-2xl tracking-normal">(Aria)</span>
        </h2>
        <div className="m-0 mb-1 p-0 md:text-base sm:text-sm">Your AI Research Assistant</div>
        <div className="md:text-base hidden sm:block">
          Aria analyzes and understands the content of your Zotero library. It can help streamline your research process
          by performing automatic literature search, summarization, and question & answer
        </div>
      </div>
    </header>
  )
}
