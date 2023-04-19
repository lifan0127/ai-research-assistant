import { Tool } from 'langchain/tools'
import { parse } from 'search-query-parser'
import { serializeError } from 'serialize-error'

export class ZoteroSearch extends Tool {
  name = 'zotero-search'

  constructor() {
    super()
  }

  async _call(input: string) {
    try {
      const s = new Zotero.Search()
      s.addCondition('itemType', 'isNot', 'attachment')

      const query = parse(input, {
        keywords: ['creator', 'tag'],
        ranges: ['year'],
        alwaysArray: true,
        offsets: false,
      })
      console.log({ query })
      if (typeof query === 'string') {
        s.addCondition('quicksearch-everything', 'contains', query)
      } else {
        const {
          text,
          creator = [],
          tag = [],
          year,
        } = query as {
          text?: string
          creator?: string[]
          tag?: string[]
          year?: { from: string; to: string }
        }
        text?.split(' ').forEach(t => s.addCondition('quicksearch-everything', 'contains', t))
        creator.forEach(c => c.split(' ').forEach(w => s.addCondition('creator', 'contains', w)))
        tag.forEach(t => s.addCondition('tag', 'is', t))
        year && year.from && s.addCondition('date', 'isAfter', `${parseInt(year.from) - 1}`)
        year && year.to && s.addCondition('date', 'isBefore', `${parseInt(year.to) + 1}`)
      }

      const ids: number[] = await s.search()

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
      return `No results was found in user's Zotero library for query: ${input}.`
    } catch (error) {
      const errorObj = serializeError(error)
      console.log({ zoteroSearchError: errorObj })
      return `Error: ${errorObj.message}`
    }
  }

  description = `Useful for finding relevant articles from user's personal Zotero database. The gathered articles can then be used to answer user question. The input to this tool should be a search query, which is either a set of keywords (example: machine learning materials discovery), or a search query syntax created by the zotero-query tool (example: chemistry creator:white tag:"machine learning").`
}
