import { getItemAndBestAttachment } from './item'

export async function createCitations(
  itemIds: number[],
  style = 'http://www.zotero.org/styles/american-chemical-society'
) {
  const csl = Zotero.Styles.get(style).getCiteProc()
  csl.updateItems(itemIds)
  const bibs = csl.makeBibliography()[1]
  const items = await Promise.all(itemIds.map(async id => await getItemAndBestAttachment(id, 'citation')))
  return items.map((item, i) => ({ ...item, bib: bibs[i] }))
}
