// Implementation: https://github.com/zotero/zotero/blob/fe752fd9375e0d12f9a5ad751abf7b738c870e53/components/zotero-autocomplete.js
// Example: https://github.com/zotero/zotero/blob/fe752fd9375e0d12f9a5ad751abf7b738c870e53/chrome/content/zotero/containers/tagsBoxContainer.jsx#L66
const { classes: Cc, interfaces: Ci } = Components
const search = Cc['@mozilla.org/autocomplete/search;1?name=zotero'].createInstance(Ci.nsIAutoCompleteSearch)

export type FieldName = 'tag' | 'creator' | 'title' | 'collection'

export async function suggest(qtext: string, fieldName: FieldName) {
  let i = 0
  return new Promise(function (resolve, reject) {
    var results: any = []
    search.startSearch(
      qtext,
      JSON.stringify({
        fieldName: fieldName,
        fieldMode: 2,
      }),
      [],
      {
        onSearchResult: function (search: any, result: any) {
          if (result.searchResult == result.RESULT_IGNORED || result.searchResult == result.RESULT_FAILURE) {
            reject(result.errorDescription)
            return
          }
          if (result.searchResult == result.RESULT_SUCCESS || result.searchResult == result.RESULT_SUCCESS_ONGOING) {
            // Pick up where we left off
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
  let output = []
  for (let row of results) {
    output.push({
      id: row.collectionID,
      title: row.collectionName,
      itemCount: row.itemCount,
    })
  }
  return output
}
