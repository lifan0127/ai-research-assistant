import React from 'react'

interface IconProps {
  enlarged?: boolean
}

interface ZoteroIconProps extends IconProps {
  category: string
  itemType?: string | undefined
}

function ZoteroIcon({ category, itemType, enlarged = false }: ZoteroIconProps) {
  const url = itemType
    ? `chrome://zotero/skin/${category}-${itemType}${enlarged ? '@2x' : ''}.png`
    : `chrome://zotero/skin/${category}${enlarged ? '@2x' : ''}.png`
  return (
    <span className="mx-0.5">
      <img src={url}></img>
    </span>
  )
}

interface ItemIconProps extends IconProps {
  itemType?: Zotero.Item.ItemType
}

export function ItemIcon(props: ItemIconProps) {
  return <ZoteroIcon category="treeitem" {...props} />
}

interface LocateItemProps extends IconProps {
  itemType: 'external-viewer' | 'internal-viewer' | 'show-file' | 'view-online'
}

export function LocateIcon(props: LocateItemProps) {
  return <ZoteroIcon category="locate" {...props} />
}
