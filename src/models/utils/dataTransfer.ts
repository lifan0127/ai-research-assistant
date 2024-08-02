import { compileItemInfo, compileAttachmentInfo } from '../../apis/zotero/item'

export async function parseDataTransfer(dataTransfer: DataTransfer) {
  const { items, types, files } = dataTransfer
  const type = types.includes('zotero/item')
    ? 'zotero/item'
    : types.includes('zotero/collection')
    ? 'zotero/collection'
    : types.includes('zotero/annotation')
    ? 'zotero/annotation'
    : 'text/plain'
  switch (type) {
    case 'zotero/item': {
      const ids = dataTransfer
        .getData(type)
        .split(',')
        .map(x => parseInt(x))
      const items = await Promise.all(
        ids.map(async id => {
          const item = await Zotero.Items.getAsync(id)
          if (item.isAttachment()) {
            return {
              ...compileAttachmentInfo(item),
              title: item.getDisplayTitle(),
              isAttachment: true,
            }
          } else {
            return compileItemInfo(item, 'search')
          }
        })
      )
      return {
        type,
        items,
      }
    }
    case 'zotero/collection': {
      const id = parseInt(dataTransfer.getData(type))
      const collection = Zotero.Collections.get(id) as Zotero.Collection
      const title = collection.name
      const itemCount = collection.getChildItems().length
      const label = `${title} (${itemCount} ${itemCount > 1 ? 'items' : 'item'})`
      return {
        type,
        collection: { id, title: label },
      }
    }
    case 'zotero/annotation': {
      const {
        attachmentItemID,
        id: key,
        type: annotationType,
        image,
      } = JSON.parse(dataTransfer.getData('zotero/annotation'))[0]
      if (annotationType !== 'image') {
        return {
          type: 'text/plain',
          text: `Sorry. Only image-based annotations are currently supported.`,
        }
      }
      const libraryID = (await Zotero.Items.getAsync(attachmentItemID)).libraryID
      return {
        type: 'zotero/annotation-image',
        image,
        libraryID,
        key,
      }
    }
    case 'text/plain': {
      return {
        type,
        text: dataTransfer.getData('text/plain'),
      }
    }
  }
}

Zotero.Annotations
