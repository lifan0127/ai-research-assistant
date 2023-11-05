import { getItemAndBestAttachment } from './item'
import retry, { Options } from 'async-retry'

export async function createCitations(
  itemIds: number[],
  style = 'http://www.zotero.org/styles/american-chemical-society'
) {
  const csl = Zotero.Styles.get(style).getCiteProc()
  csl.updateItems(itemIds)
  const bibs = csl.makeBibliography()[1]
  const items = await Promise.all(
    itemIds.map(
      async id => await retry(async () => getItemAndBestAttachment(id, 'citation'), { retries: 3 } as Options)
    )
  )
  return items.map((item, i) => ({ ...item, bib: bibs[i] }))
}
