import React from 'react'

interface LinkProps {
  url: string
  text: string
}

export function Link({ url, text }: LinkProps) {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    event.preventDefault()
    Zotero.launchURL(url)
  }

  return (
    <a href={url} onClick={handleClick} className="text-tomato hover:underline">
      {text ?? url}
    </a>
  )
}
