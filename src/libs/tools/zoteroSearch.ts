import { Tool } from 'langchain/tools'

export class ZoteroSearch extends Tool {
  name = 'zotero-search'

  constructor() {
    super()
  }

  async _call(input: string) {
    try {
      const s = new Zotero.Search()
      s.addCondition('quicksearch-everything', 'contains', input)
      s.addCondition('itemType', 'isNot', 'attachment')
      s.set
      const ids: number[] = await await s.search()

      const results = await Promise.all(
        ids.map(async id => {
          return await Zotero.Items.getAsync(id)
        })
      )
      const output = results
        .filter(item => (item.itemType as string) !== 'attachment')
        .slice(0, 5)
        .map(item => {
          const id = item.id
          const itemType = item.itemType
          const title = item.getField('title', false, true)
          const author = item.getField('firstCreator', false, true)
          const date = item.getField('date', true, true) as string
          return `
          id: ${id}
          itemType: ${itemType}
          title: ${title}
          author: ${author}
          date: ${date}
          `
        })
      if (output.length) {
        return output.join('------------------------')
      }
      return `No results found for query: ${input}`
    } catch (error) {
      console.log({ zoteroSearchError: error })
      return "I don't know how to do that."
    }
  }

  description = `Useful for using a search query to find relevant articles from user's personal Zotero database. The gather articles can then be used to answer user question. The input to this tool should be a search query.`
}
