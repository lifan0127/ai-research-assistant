import React, { useState, useEffect } from "react"
import { config, version } from "../../../package.json"
import { useScrollPosition } from "../../hooks/useScroll"

interface HeaderProps {
  containerRef: React.RefObject<HTMLDivElement>
  children?: React.ReactNode
}

export function Header({ containerRef, children }: HeaderProps) {
  const scrollPosition = useScrollPosition(containerRef)
  // Calculate styles based on scroll position
  const isScrolled = scrollPosition > 50

  const headerStyle = isScrolled
    ? "lg:text-3xl md:text-2xl sm:text-xl text-lg"
    : ""

  // Dynamically calculate height for the logo image
  const logoSize = isScrolled
    ? "h-12 w-12"
    : "h-20 w-20 sm:h-22 sm:w-22 md:h-24 md:w-24 lg:h-28 lg:w-28"

  // Reduce padding when scrolled
  const padding = isScrolled ? "py-1" : "py-2"

  const menuTop = isScrolled ? "top-3" : "top-6"

  return (
    <header
      className={`w-full flex flex-row text-neutral-500 sticky top-0 z-50 transition-all duration-300 ease-linear ${padding}`}
    >
      <div
        className={`hidden sm:block mr-6 transition-all duration-300 ease-linear ${logoSize}`}
      >
        <img
          className="h-full w-full object-contain"
          src={`chrome://${config.addonRef}/content/icons/favicon@4x.png`}
          alt="Aria Logo"
        />
      </div>
      <div className="flex flex-col justify-center">
        <h2
          className={`m-0 p-0 text-tomato lg:text-4xl md:text-3xl sm:text-2xl text-xl tracking-wider transition-all duration-300 ease-linear ${headerStyle}`}
        >
          A.R.I.A.
          <span className="ml-2 tracking-normal">(Aria)</span>
        </h2>
        <div
          className={`m-0 p-0 lg:text-xl md:text-lg sm:text-base text-sm transition-opacity duration-300 ease-linear `}
        >
          Your AI Research Assistant
        </div>
        {/* <div
          className={`lg:text-lg md:text-base hidden sm:block transition-opacity duration-300 ease-linear ${
            isScrolled ? "opacity-0" : "opacity-100"
          }`}
        >
          Aria analyzes and understands the content of your Zotero library. It
          can help streamline your research process by performing automatic
          literature search, summarization, and question & answer
        </div> */}
      </div>
      <div
        className={`absolute z-10 right-2 transition-all duration-300 ease-linear ${menuTop}`}
      >
        {children}
      </div>
    </header>
  )
}
