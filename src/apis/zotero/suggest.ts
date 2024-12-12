// Implementation: https://github.com/zotero/zotero/blob/fe752fd9375e0d12f9a5ad751abf7b738c870e53/components/zotero-autocomplete.js
// Example: https://github.com/zotero/zotero/blob/fe752fd9375e0d12f9a5ad751abf7b738c870e53/chrome/content/zotero/containers/tagsBoxContainer.jsx#L66
const { classes: Cc, interfaces: Ci } = Components

export type FieldName = 'tag' | 'creator' | 'title' | 'collection'

// The field name must match FieldName. Otherwise, the function will fail silently.
export async function suggest(qtext: string, fieldName: FieldName) {
  let i = 0
  const search = Cc['@mozilla.org/autocomplete/search;1?name=zotero'].createInstance(Ci.nsIAutoCompleteSearch)
  return new Promise(function (resolve, reject) {
    if (!['tag', 'creator', 'title', 'collection'].includes(fieldName)) {
      reject(new Error(`Invalid field name: ${fieldName}`))
      return
    }
    console.log('Zotero Suggest', qtext, fieldName)
    const results: any = []
    search.startSearch(
      qtext,
      JSON.stringify({
        fieldName: fieldName,
        fieldMode: 2,
      }),
      [],
      {
        onSearchResult: function (search: any, result: any) {
          try {
            if (result.searchResult == result.RESULT_IGNORED || result.searchResult == result.RESULT_FAILURE) {
              reject(result.errorDescription)
              return
            }
            if (result.searchResult == result.RESULT_SUCCESS || result.searchResult == result.RESULT_SUCCESS_ONGOING) {
              for (; i < result.matchCount; i++) {
                results.push(result.getValueAt(i).trim())
              }
            }
            if (
              result.searchResult != result.RESULT_SUCCESS_ONGOING &&
              result.searchResult != result.RESULT_NOMATCH_ONGOING
            ) {
              resolve(results)
            }
          } catch (error) {
            console.error('Zotero Suggest Error', error)
            reject(error)
          }
        },
      }
    )
  })
}

interface SuggestItemsInput {
  qtext: string
  limit?: number
}

export async function suggestItems({ qtext, limit = 10 }: SuggestItemsInput) {
  const s = new Zotero.Search()
  s.addCondition('title', 'contains', qtext)
  s.addCondition('itemType', 'isNot', 'attachment')
  let ids = await s.search()
  return Promise.all(
    ids.slice(0, limit).map(async id => {
      const item = await Zotero.Items.getAsync(id)
      const title = item.getField('title')
      return { id, title, item }
    })
  )
}

interface SuggestInput {
  qtext: string
  limit?: number
}

interface SuggestCollectionsInput {
  qtext: string
  limit?: number
}

export async function suggestCollections({ qtext, limit = 10 }: SuggestCollectionsInput) {
  const sql = `
        SELECT c.collectionID, c.collectionName, COUNT(ci.itemID) as itemCount
        FROM collections c
        LEFT JOIN collectionItems ci ON c.collectionID=ci.collectionID
        WHERE c.collectionName Like ?1
        GROUP BY c.collectionName
        LIMIT ?2
      `.trim()
  const query = '%' + qtext.split(' ').join('%') + '%'
  const results = await Zotero.DB.queryAsync(sql, [query, limit])
  const output = []
  for (let row of results) {
    output.push({
      id: row.collectionID,
      title: row.collectionName,
      itemCount: row.itemCount,
    })
  }
  return output
}

async function runSuggestQuery(sql: string, params: any[]) {
  const results = (await Zotero.DB.queryAsync(sql, params)) as { name: string }[] || []
  const output = []
  for (const row of results) {
    output.push(row.name)
  }
  return output
}

export async function suggestTags({ qtext, limit = 10 }: SuggestInput) {
  const sql = `
        SELECT DISTINCT name
        FROM tags 
        WHERE name LIKE ?1 ESCAPE '\\'
        ORDER BY name COLLATE locale
        LIMIT ?2
      `.trim()
  const query = '%' + qtext.split(' ').join('%') + '%'
  return runSuggestQuery(sql, [query, limit])
}

export async function suggestCreators({ qtext, limit = 10 }: SuggestInput) {
  const sql = `
        SELECT DISTINCT CASE fieldMode WHEN 1 THEN lastName
        WHEN 0 THEN firstName || ' ' || lastName END AS name
        FROM creators
        WHERE CASE fieldMode
        WHEN 1 THEN lastName LIKE ?1
        WHEN 0 THEN (firstName || ' ' || lastName LIKE ?1) OR (lastName LIKE ?1) END
        ORDER BY name
        LIMIT ?2
      `.trim()
  const query = '%' + qtext.split(' ').join('%') + '%'
  return runSuggestQuery(sql, [query, limit])
}