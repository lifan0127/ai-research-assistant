import { Tool } from 'langchain/tools'
import { serializeError } from 'serialize-error'

export class ZoteroItem extends Tool {
  name = 'zotero-item'

  constructor() {
    super()
  }

  async _call(input: string) {
    try {
      const item = await Zotero.Items.getAsync(parseInt(input))
      const id = item.id
      const itemType = item.itemType
      const title = item.getField('title', false, true)
      const abstract = item.getField('abstractNote', false, true) || ''
      const author = item.getField('firstCreator', false, true)
      const date = item.getField('date', true, true) as string
      const publication = item.getField('publicationTitle', false, true)
      return `
      ## ID
      ${id}

      ## Item Type
      ${itemType}
      
      ## Title
      ${title}

      ## Abstract
      ${abstract}

      ## Author
      ${author} et al.

      ## Publication Date
      ${date}

      ## Publication Name
      ${publication}
      `
    } catch (error) {
      const errorObj = serializeError(error)
      console.log({ zoteroItemError: errorObj })
      return `Error: ${errorObj.message}`
    }
  }

  description = `Useful for retrieving an item from Zotero and extract some key fields for summarization. The input to this tool should be a string representing an item ID such as "576".`
}
