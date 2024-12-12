import React, { ReactNode } from "react"
import { ItemButton } from "../components/buttons/ItemButton"

export const customMarkdownRenderer = {
  link(href: string, content: ReactNode | string) {
    if (href.startsWith("aria://items/")) {
      const [type, id] = href.slice(13).split("/")
      return (
        <ItemButton
          item={{ type: type as Zotero.Item.ItemType, id: parseInt(id) }}
          mode="item"
          text={content as string}
        />
      )
    } else {
      return (
        <button
          key={href}
          className="text-tomato p-0 border-none bg-transparent hover:underline hover:cursor-pointer"
          onClick={() => Zotero.launchURL(href)}
        >
          {content}
        </button>
      )
    }
  },
}
