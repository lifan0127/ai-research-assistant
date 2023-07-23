import { Tool } from 'langchain/tools'
import { serializeError } from 'serialize-error'

export class ZoteroCreators extends Tool {
  name = 'zotero-creators'

  constructor() {
    super()
  }

  async _call(input: string) {
    try {
      // Must trim the input or the query won't run
      const sql = `
        SELECT DISTINCT CASE fieldMode 
          WHEN 1 THEN lastName 
				  WHEN 0 THEN firstName || ' ' || lastName END AS val, NULL AS id 
				FROM creators
        WHERE CASE fieldMode 
          WHEN 1 THEN lastName LIKE ?1
          WHEN 0 THEN (firstName || ' ' || lastName LIKE ?1) OR (lastName LIKE ?1) END
        ORDER BY val
        LIMIT 10
      `.trim()
      const results = await Zotero.DB.queryAsync(sql, [`${input}`])
      // Unpack the iterator array
      let output: string[] = []
      for (let row of results) {
        output.push(row.val)
      }
      return output.join('\n')
    } catch (error) {
      const errorObj = serializeError(error)
      console.log({ zoteroCreatorsError: errorObj })
      return `Error: ${errorObj.message}`
    }
  }

  description = `Useful for searching for creators (authors, editors) in Zotero. The input to this tool should be a string representing a partial creator name.`
}
