import React from "react"
import { config } from "../../../package.json"

interface OpenAIIconProps {
  isLoading?: boolean
}

export function OpenAIIcon({ isLoading = false }: OpenAIIconProps) {
  return (
    <span className="mx-0.5">
      <img
        className={`align-middle ${isLoading ? "animate-pulse" : ""}`}
        src={`chrome://${config.addonRef}/content/icons/openai.png`}
      ></img>
    </span>
  )
}
