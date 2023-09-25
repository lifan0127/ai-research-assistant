import React from 'react'

interface IconProps {
  enlarged?: boolean
}

interface ZoteroIconProps extends IconProps {
  category: string
  type?: string | undefined
}

function ZoteroIcon({ category, type, enlarged = false }: ZoteroIconProps) {
  const url = type
    ? `chrome://zotero/skin/${category}-${type}${enlarged ? '@2x' : ''}.png`
    : `chrome://zotero/skin/${category}${enlarged ? '@2x' : ''}.png`
  return (
    <span className="mx-0.5">
      <img className="align-middle" src={url}></img>
    </span>
  )
}

interface ItemIconProps extends IconProps {
  type?: Zotero.Item.ItemType
}

export function ItemIcon(props: ItemIconProps) {
  return <ZoteroIcon category="treeitem" {...props} />
}

export function CollectionIcon(props: IconProps) {
  return <ZoteroIcon category="treesource" type="collection" {...props} />
}

interface LocateItemProps extends IconProps {
  type: 'external-viewer' | 'internal-viewer' | 'show-file' | 'view-online'
}

export function LocateIcon(props: LocateItemProps) {
  return <ZoteroIcon category="locate" {...props} />
}
