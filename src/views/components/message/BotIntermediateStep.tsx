import React from 'react'
import { Markdown, MarkdownProps } from '../widgets/Markdown'

export interface BotIntermediateStepProps {
  id: string
  timestamp: string
  type: 'BOT_INTERMEDIATE_STEP'
  widget: 'MARKDOWN'
  input: MarkdownProps
}

export function BotIntermediateStep({ input }: BotIntermediateStepProps) {
  return (
    <div className="relative w-auto self-start max-w-[90%] sm:max-w-[70%] my-1 pb-1">
      <div className="p-0 [&>*]:mx-2 [&>*]:my-0 text-black break-words">
        <Markdown content={input.content} />
      </div>
    </div>
  )
}
