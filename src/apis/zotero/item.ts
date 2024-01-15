export interface ItemInfo {
  id: number
  uri: string
  type: Zotero.Item.ItemType
  title?: string
  creators?: string
  year?: number
  abstract?: string
}

export interface AttachmentInfo {
  id: number
  type:
    | 'attachment-pdf'
    | 'attachment-pdf-link'
    | 'attachment-file'
    | 'attachment-link'
    | 'attachment-snapshot'
    | 'attachment-web-link'
}

type ItemMode = 'search' | 'qa' | 'citation'

export function compileItemInfo(item: Zotero.Item, mode: ItemMode): ItemInfo {
  let itemInfo: ItemInfo = { id: item.id, uri: Zotero.URI.getItemURI(item), type: item.itemType }
  if (mode !== 'citation') {
    const title = item.getDisplayTitle()
    const creators = item.getCreators()
    const creatorsStr =
      creators.length === 0
        ? undefined
        : creators.length > 1
        ? `${creators[0].lastName} et al.`
        : `${creators[0].firstName} ${creators[0].lastName}`
    const year = new Date(item.getField('date') as string).getFullYear()
    itemInfo = { ...itemInfo, title, creators: creatorsStr, year }
  }
  if (mode === 'qa') {
    const abstract = (item.getField('abstractNote', false, true) as string) || ''
    itemInfo = { ...itemInfo, abstract }
  }
  return itemInfo
}

export function compileAttachmentInfo(attachment: Zotero.Item): AttachmentInfo {
  let attachmentInfo: AttachmentInfo = { id: attachment.id, type: 'attachment-file' }
  const linkMode = attachment.attachmentLinkMode
  if (attachment.attachmentContentType === 'application/pdf' && attachment.isFileAttachment()) {
    if (linkMode === Zotero.Attachments.LINK_MODE_LINKED_FILE) {
      attachmentInfo.type = 'attachment-pdf-link' as const
    } else {
      attachmentInfo.type = 'attachment-pdf' as const
    }
  } else if (linkMode == Zotero.Attachments.LINK_MODE_IMPORTED_FILE) {
    attachmentInfo.type = 'attachment-file' as const
  } else if (linkMode == Zotero.Attachments.LINK_MODE_LINKED_FILE) {
    attachmentInfo.type = 'attachment-link' as const
  } else if (linkMode == Zotero.Attachments.LINK_MODE_IMPORTED_URL) {
    attachmentInfo.type = 'attachment-snapshot' as const
  } else if (linkMode == Zotero.Attachments.LINK_MODE_LINKED_URL) {
    attachmentInfo.type = 'attachment-web-link' as const
  }
  return attachmentInfo
}

export async function getItemAndBestAttachment(id: number, mode: ItemMode) {
  const item = await Zotero.Items.getAsync(id)
  const itemInfo = compileItemInfo(item, mode)
  if (mode === 'qa') {
    return { item: itemInfo }
  }
  const attachment = await item.getBestAttachment()
  // Ref: https://github.com/zotero/zotero/blob/17daf9fe8dc792b1554a2a17e153fb90290617b3/chrome/content/zotero/itemTree.jsx#L3777
  if (!attachment) {
    return { item: itemInfo }
  }
  const attachmentInfo: AttachmentInfo = compileAttachmentInfo(attachment)
  return { item: itemInfo, attachment: attachmentInfo }
}

export async function findItemByTitle(title: string) {
  const s = new Zotero.Search()
  s.addCondition('title', 'is', title)
  const ids = await s.search()
  if (ids.length === 0) {
    return
  }
  const item = await Zotero.Items.getAsync(ids[0])
  return compileItemInfo(item, 'search')
}

export async function getItemById(id: number) {
  const item = await Zotero.Items.getAsync(id)
  return compileItemInfo(item, 'search')
}
