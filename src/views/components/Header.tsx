import React from 'react'
import { config, version } from '../../../package.json'

export function Header() {
  return (
    <header className="w-full flex flex-row text-neutral-500 pt-2">
      <div className="md:w-48 sm:w-32 xs:w-16 hidden sm:block mr-6">
        <img className="max-w-full" src={`chrome://${config.addonRef}/content/icons/favicon@4x.png`} alt="Aria Logo" />
      </div>
      <div>
        <h2 className="m-0 my-1 md:my-3 p-0 text-tomato lg:text-4xl md:text-3xl sm:text-2xl text-xl tracking-wider">
          A.R.I.A.
          <span className="ml-2 tracking-normal">(Aria)</span>
        </h2>
        <div className="m-0 mb-1 p-0 lg:text-lg md:text-base sm:text-sm text-xs">Your AI Research Assistant</div>
        <div className="lg:text-lg md:text-base hidden sm:block">
          Aria analyzes and understands the content of your Zotero library. It can help streamline your research process
          by performing automatic literature search, summarization, and question & answer
        </div>
      </div>
    </header>
  )
}
