export async function getCollectionById(id: number) {
  const collection = await Zotero.Collections.getAsync(id)
  return { title: (collection as any).name, id }
}

export async function createCollection(name: string, libraryID?: number) {
  const library = libraryID || Zotero.Libraries.userLibraryID
  const collections = Zotero.Collections.getByLibrary(library)
  const collection = collections.find((c: Zotero.Collection) => c.name === name)
  if (collection) {
    return collection
  }
  const newCollection = new Zotero.Collection({
    name,
    libraryID: library,
  })
  await newCollection.saveTx()
  return newCollection
}
