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
    ? "lg:text-3xl md:text-xl text-2xl"
    : "lg:text-4xl md:text-3xl text-2xl"

  // Dynamically calculate height for the logo image
  const logoSize = isScrolled
    ? "h-12 w-12"
    : "h-20 w-20 sm:h-22 sm:w-22 md:h-24 md:w-24 lg:h-28 lg:w-28"

  const taglineSize = isScrolled
    ? "lg:text-lg md:text-base text-sm"
    : "lg:text-xl md:text-base text-sm"

  // Reduce padding when scrolled
  const padding = isScrolled ? "py-1" : "py-2"

  const menuTop = isScrolled ? "top-3" : "top-6"

  return (
    <header
      className={`w-full flex items-center justify-between text-neutral-500 sticky top-0 z-50 transition-all duration-300 ease-linear ${padding}`}
    >
      <div className="flex items-center">
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
            className={`m-0 p-0 text-tomato tracking-wider transition-all duration-300 ease-linear ${headerStyle}`}
          >
            A.R.I.A.
            <span className="ml-2 tracking-normal">(Aria)</span>
          </h2>
          <div
            className={`hidden md:block m-0 p-0 transition-opacity duration-300 ease-linear ${taglineSize}`}
          >
            Your AI Research Assistant
          </div>
        </div>
      </div>
      <div className={`transition-all duration-300 ease-linear ${menuTop}`}>
        {children}
      </div>
    </header>
  )
}
