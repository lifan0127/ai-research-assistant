import { compileItemInfo, compileAttachmentInfo } from './zotero'

export async function parseDataTransfer(dataTransfer: DataTransfer) {
  const { items, types } = dataTransfer
  const type = types.includes('zotero/item')
    ? 'zotero/item'
    : types.includes('zotero/collection')
    ? 'zotero/collection'
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
              ...compileAttachmentInfo(item, 'search'),
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
      console.log({ dataTransfer })
      const id = parseInt(dataTransfer.getData(type))
      const collection = Zotero.Collections.get(id) as Zotero.Collection
      const title = collection.name
      const label = `${title} (${collection.getChildItems().length} items)`
      return {
        type,
        collection: { id, title, label },
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
