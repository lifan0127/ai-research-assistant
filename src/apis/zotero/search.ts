import { uniq, cloneDeep, flatten } from 'lodash'
import { getItemAndBestAttachment } from './item'
import retry, { Options } from 'async-retry'

interface SearchInput {
  keywords?: string[]
  creators?: string[]
  tags?: string[]
  years?: { from?: number; to?: number }
  length: number
  collectionIDs?: number[]
}

export async function search({
  keywords = [],
  creators = [],
  tags = [],
  years = {},
  length,
  collectionIDs = [],
}: SearchInput) {
  // TODO: support collection IDs instead of a single collection
  let searches: Zotero.Search[] = []
  const s = new Zotero.Search()
  const collections = collectionIDs.map(id => Zotero.Collections.get(id) as Zotero.Collection)
  s.addCondition('itemType', 'isNot', 'attachment')
  creators.forEach(creator => s.addCondition('creator', 'is', creator))
  tags.forEach(tag => s.addCondition('tag', 'is', tag))
  years.from && s.addCondition('date', 'isAfter', `${years.from - 1}`)
  years.to && s.addCondition('date', 'isBefore', `${years.to + 1}`)
  if (keywords.length > 0) {
    searches = keywords.map(keyword => {
      const sKw = cloneDeep(s)
      sKw.addCondition('quicksearch-everything', 'contains', keyword)
      return sKw
    })
  } else {
    s.addCondition('quicksearch-everything', 'contains', '')
    searches.push(s)
  }
  let ids: number[] = []
  if (collectionIDs.length === 0) {
    ids = flatten(await Promise.all(searches.map(search => search.search())))
  } else {
    ids = flatten(
      await Promise.all(
        collectionIDs.map(async collectionID =>
          flatten(
            await Promise.all(
              searches.map(async search => {
                const { libraryID, key } = Zotero.Collections.getLibraryAndKeyFromID(collectionID) || {}
                const sCo = cloneDeep(search)
                sCo.addCondition('libraryID', 'is', libraryID as any)
                sCo.addCondition('collection', 'is', key as string)
                return await sCo.search()
              })
            )
          )
        )
      )
    )
  }

  const uniqueIds = uniq(ids)
  const results = await Promise.all(
    uniqueIds
      .slice(0, length)
      .map(async id => await retry(async () => getItemAndBestAttachment(id, 'search'), { retries: 3 } as Options))
  )
  return { count: ids.length, results, collections }
}
