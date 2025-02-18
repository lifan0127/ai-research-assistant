import { States } from "../models/utils/states"
import { MentionValue } from './input'
import { ItemInfo, AttachmentInfo } from './zotero'

export type StateName = 'items' | 'collections' | 'creators' | 'tags' | 'images'

export type SelectedItem = ItemInfo | (AttachmentInfo & { title: string })
export type SelectedCollection = { id: number; type: 'collection'; title: string }
export type SelectedCreator = { id: string; type: 'creator'; title: string }
export type SelectedTag = { id: string; type: 'tag'; title: string }
export type SelectedImage = { id: string; type: 'image'; title: string; image: string }
export type StateSelection = SelectedItem | SelectedCollection | SelectedCreator | SelectedTag | SelectedImage
export type StateSelections =
  | SelectedItem[]
  | SelectedCollection[]
  | SelectedCreator[]
  | SelectedTag[]
  | SelectedImage[]

export type States = {
  items: SelectedItem[]
  collections: SelectedCollection[]
  creators: SelectedCreator[]
  tags: SelectedTag[]
  images: SelectedImage[]
}
export type SimplifiedStates = {
  items?: number[]
  collections?: number[]
  creators?: string[]
  tags?: string[]
  images?: string[]
}

export interface MentionValue {
  newValue: string
  newPlainTextValue: string
  mentions: { childIndex: number; display: string; id: string; index: number; plainTextIndex: number }[]
}

export interface UserInput {
  content: MentionValue
  states: States
}

