import React from 'react'

export interface UserMessageProps {
  id: string
  timestamp: string
  type: 'USER_MESSAGE'
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="relative w-auto self-end max-w-[70%] my-2 pb-2">
      <div className="bg-tomato p-2 [&>*]:mx-2 [&_*]:my-0 [&_*]:leading-6 border border-neutral-500 rounded-xl shadow-md shadow-black/20 text-white break-words">
        <pre className="whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
          {content}
        </pre>
      </div>
    </div>
  )
}
