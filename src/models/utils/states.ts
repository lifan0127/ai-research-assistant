import YAML from 'yaml'
import { ItemInfo, AttachmentInfo } from '../../models/utils/zotero'

export type SelectedItem = ItemInfo | (AttachmentInfo & { title: string })
export type SelectedCollection = { id: number; label: string }
export type States = {
  selectedItems?: SelectedItem[]
  selectedCollection?: SelectedCollection
}

export function serializeStates(states: States) {
  if (states.selectedItems && states.selectedItems.length > 0) {
    return 'Application States:\n' + YAML.stringify({ selectedItems: states.selectedItems.map(({ id }) => id) })
  } else if (states.selectedCollection) {
    return 'Application States:\n' + YAML.stringify({ selectedCollection: states.selectedCollection.id })
  }
  return undefined
}
