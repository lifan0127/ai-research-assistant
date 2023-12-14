import React from 'react'
import * as Markdown from '../widgets/Markdown'
import { BotIntermediateStepProps } from './types'

export function BotIntermediateStep({ input }: BotIntermediateStepProps) {
  return (
    <div className="relative w-auto self-start max-w-[90%] sm:max-w-[70%] my-1 pb-1">
      <div className="p-0 [&>*]:mx-2 [&>*]:my-0 text-black break-words">
        <Markdown.Component content={input.content} />
      </div>
    </div>
  )
}
