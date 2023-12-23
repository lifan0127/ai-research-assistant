import { ARIA_LIBRARY } from '../../constants'
import { createCollection } from './collection'

export async function createStandaloneNote(content: string, collectionId?: number, addToAriaCollection = true) {
  const note = new Zotero.Item('note')
  note.setNote(content)
  if (collectionId) {
    note.addToCollection(collectionId)
  }
  if (addToAriaCollection) {
    const ariaCollection = await createCollection(ARIA_LIBRARY)
    note.addToCollection(ariaCollection.id)
  }
  await note.saveTx()
  return note
}

export async function createChildNote(content: string, itemId: number) {
  const note = new Zotero.Item('note')
  note.setNote(content)
  note.parentID = itemId
  await note.saveTx()
  return note
}
