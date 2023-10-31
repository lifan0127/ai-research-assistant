export async function getCollectionById(id: number) {
  const collection = await Zotero.Collections.getAsync(id)
  return { title: (collection as any).name, id }
}
