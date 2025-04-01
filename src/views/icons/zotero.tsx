import React from "react"
import { StateName } from "../../typings/input"
import "./style.css"

interface IconProps {
  enlarged?: boolean
}

interface BaseIconProps extends IconProps {
  category: string
  type?: string | undefined
}

// All available icons: https://github.com/zotero/zotero/tree/f012a348af1143a7e033d697beae86df729080ab/chrome/skin/default/zotero
function BaseIcon({ category, type, enlarged = false }: BaseIconProps) {
  // tag.png is no longer available: https://github.com/zotero/zotero/blob/main/chrome/skin/default/zotero/tag.svg
  const url =
    category === "tag"
      ? "chrome://zotero/skin/tag.svg"
      : type
        ? `chrome://zotero/skin/${category}-${type}${enlarged ? "@2x" : ""}.png`
        : `chrome://zotero/skin/${category}${enlarged ? "@2x" : ""}.png`
  return (
    <span className="mx-0.5">
      <img className="align-middle" src={url}></img>
    </span>
  )
}

interface ItemIconProps extends IconProps {
  type: _ZoteroTypes.Item.ItemType
}

export function ItemIcon({ type }: ItemIconProps) {
  const iconType = type
    .replace("pdf", "PDF")
    .replace("epub", "EPUB")
    .replace(/-(.)/g, (_: string, g1: string) => g1.toUpperCase())
  return (
    <span
      className="icon icon-css icon-item-type cell-icon"
      data-item-type={iconType}
    ></span>
  )
}

export function CollectionIcon(props: IconProps) {
  // return <ZoteroIcon category="treesource" type="collection" {...props} />;
  return <span className="icon icon-css icon-collection cell-icon"></span>
}

export function TagIcon(props: IconProps) {
  return <BaseIcon category="tag" {...props} />
}

export function CreatorIcon(props: IconProps) {
  // return <ZoteroIcon category="treesource" type="groups" {...props} />;
  return <span className="icon icon-css icon-groups cell-icon"></span>
}

interface LocateItemProps extends IconProps {
  type: "external-viewer" | "internal-viewer" | "show-file" | "view-online"
}

export function LocateIcon(props: LocateItemProps) {
  return <BaseIcon category="locate" {...props} />
}

export function SelectionIcon({
  name,
  id,
  type,
}: {
  name: StateName
  id?: number
  type?: _ZoteroTypes.Item.ItemType | "collection" | "creator" | "tag" | "image"
}) {
  switch (name) {
    case "items": {
      return <ItemIcon key={id} type={type as _ZoteroTypes.Item.ItemType} />
    }
    case "collections": {
      return <CollectionIcon />
    }
    case "tags": {
      return <TagIcon />
    }
    case "creators": {
      return <CreatorIcon />
    }
    case "images":
    default: {
      return null
    }
  }
}

interface ZoteroIconProps {
  isLoading?: boolean
}

export function ZoteroIcon({ isLoading = false }: ZoteroIconProps) {
  return (
    <span className="mx-0.5">
      <img
        className={`align-middle ${isLoading ? "animate-pulse" : ""}`}
        src="chrome://zotero/skin/zotero-new-z-16px.png"
      ></img>
    </span>
  )
}
