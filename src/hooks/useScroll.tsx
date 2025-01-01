import React, { useState, useEffect, useCallback, useRef } from "react"
import { debounce } from "lodash"

class GlobalDebounceManager {
  private debouncedCallback: ((...args: any[]) => void) | null = null
  private isPaused = false

  // Create a debounced function if it doesn't exist
  public debounceGlobal(
    callback: (...args: any[]) => void,
    delay: number,
  ): (...args: any[]) => void {
    if (!this.debouncedCallback) {
      this.debouncedCallback = debounce((...args) => {
        if (!this.isPaused) {
          callback(...args)
        }
      }, delay)
    }

    return this.debouncedCallback
  }

  // Pause the debounced function
  public pause(): void {
    this.isPaused = true
  }

  // Resume the debounced function
  public resume(): void {
    this.isPaused = false
  }

  // Reset the debounced function
  public reset(): void {
    this.debouncedCallback = null
    this.isPaused = false
  }
}

const globalDebounceManager = new GlobalDebounceManager()

export function useScroll(containerRef: React.RefObject<HTMLDivElement>) {
  // Flag to ignore content-induced scrolls
  const scrollingByContentChange = useRef(false)

  // Track scroll position
  const [scrollPosition, setScrollPosition] = useState(
    containerRef.current?.scrollTop || 0,
  )

  const scrollToEnd = useCallback(() => {
    const debouncedScroll = globalDebounceManager.debounceGlobal(() => {
      if (containerRef.current) {
        scrollingByContentChange.current = true // Set the flag for content change scrolls
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }, 5)

    // Execute the debounced scroll function
    debouncedScroll()
  }, [containerRef])

  const pauseScroll = useCallback(() => {
    globalDebounceManager.pause()
  }, [])

  const resumeScroll = useCallback(() => {
    globalDebounceManager.resume()
  }, [])

  // Handle user scrolls and differentiate them from content-induced scrolls
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Handler to manage scroll events
    const handleScroll = () => {
      // Ignore scrolls caused by content change
      if (scrollingByContentChange.current) {
        scrollingByContentChange.current = false // Reset the flag
        return
      }

      // Pause scrolling if the user scrolls manually
      pauseScroll()

      // Update scroll position state
      setScrollPosition(container.scrollTop)

      // Check if user has scrolled to the bottom to resume
      const isAtScrollEnd =
        container.scrollTop + container.clientHeight >= container.scrollHeight
      if (isAtScrollEnd) {
        resumeScroll()
      }
    }

    // Attach the event listener for scroll
    container.addEventListener("scroll", handleScroll)

    // Cleanup the event listener on unmount
    return () => {
      container.removeEventListener("scroll", handleScroll)
      globalDebounceManager.reset()
    }
  }, [containerRef, pauseScroll, resumeScroll])

  return { scrollToEnd, pauseScroll, resumeScroll, scrollPosition }
}
