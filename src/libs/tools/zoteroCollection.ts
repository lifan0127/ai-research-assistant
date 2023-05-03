import { Tool } from 'langchain/tools'
import { serializeError } from 'serialize-error'

export class ZoteroCollection extends Tool {
  name = 'zotero-collection'

  constructor() {
    super()
  }

  async _call(input: string) {
    try {
      const sql = `
        SELECT c.collectionID, c.collectionName, c.parentCollectionID, c.libraryID, COUNT(ci.itemID) as itemCount
        FROM collections c
        LEFT JOIN collectionItems ci ON c.collectionID=ci.collectionID
        WHERE c.collectionID=?
        GROUP BY c.collectionID
      `.trim()
      const results = await Zotero.DB.queryAsync(sql, [`${input}`])
      let output = []
      for (let row of results) {
        output.push({
          id: row.collectionID,
          name: row.collectionName,
          parent: row.parentCollectionID,
          library: row.libraryID,
          itemCount: row.itemCount,
        })
      }
      if (output.length > 0) {
        return `ID: ${output[0].id}
        Name: ${output[0].name}
        Parent ID: ${output[0].parent}
        Library ID: ${output[0].library}
        Number of items in collection: ${output[0].itemCount}
        `
      }
      return `No collection matching ID ${input} found.`
    } catch (error) {
      return `Error retrieving collection information for ${input}`
    }
  }

  description = `Useful for retrieving the current collection information, including id, name, parent, library and number of items. The input is a collection ID.`
}
