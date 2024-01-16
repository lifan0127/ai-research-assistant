import { ItemInfo, AttachmentInfo } from '../../apis/zotero/item'

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

export function simplifyStates(states: States): SimplifiedStates {
  const simplifiedStates = {
    items: states.items.length > 0 ? states.items.map(item => item.id) : undefined,
    collections: states.collections.length > 0 ? states.collections.map(collection => collection.id) : undefined,
    creators: states.creators.length > 0 ? states.creators.map(creator => creator.id) : undefined,
    tags: states.tags.length > 0 ? states.tags.map(tag => tag.id) : undefined,
    images: states.images.length > 0 ? states.images.map(image => image.id) : undefined,
  }
  return simplifiedStates
}

export function areStatesEmpty(states: States | SimplifiedStates) {
  return (
    states !== undefined &&
    (!states.items || states.items.length === 0) &&
    (!states.collections || states.collections.length) === 0 &&
    (!states.creators || states.creators.length) === 0 &&
    (!states.tags || states.tags.length) === 0 &&
    (!states.images || states.images.length) === 0
  )
}

function serializeState(states: SimplifiedStates, name: StateName) {
  if (states?.[name] && states[name]!.length > 0) {
    return (
      `${name}:\n` +
      states[name]!.map(
        (id, i) =>
          `  ${i + 1}. ${
            ['creators', 'tags'].includes(name) ? Zotero.Utilities.Internal.Base64.decode(id as string) : id
          }`
      ).join('\n') +
      '\n'
    )
  }
  return ''
}

export function serializeStates(states: SimplifiedStates) {
  if (areStatesEmpty(states)) {
    return undefined
  }

  return (
    'Application States:\n' +
    serializeState(states, 'creators') +
    serializeState(states, 'tags') +
    serializeState(states, 'items') +
    serializeState(states, 'collections') +
    serializeState(states, 'images')
  )
}

export function escapeTitle(title: string) {
  return title.replace(/[\[]/g, '<').replace(/[\]]/g, '>')
}

export const stateNames = ['creators', 'tags', 'items', 'collections'] as StateName[]

export const selectionConfig = {
  creators: {
    label: {
      singular: 'creator',
      plural: 'creators',
    },
    prefix: '@',
    colorClass: 'rose',
    backgroundColor: 'rgb(255 228 230)', // rose-100
    // borderBottom: 'solid rgb(244 63 94)', // rose-500
    borderBottom: 'solid rgb(251 113 133)', // rose-400
  },
  tags: {
    label: {
      singular: 'tag',
      plural: 'tags',
    },
    prefix: '#',
    colorClass: 'lime',
    backgroundColor: 'rgb(236 252 203)', // lime-100
    // borderBottom: 'solid rgb(101 163 13)', // lime-600
    borderBottom: 'solid rgb(132 204 22)', // lime-500
  },
  items: {
    label: {
      singular: 'item',
      plural: 'items',
    },
    prefix: '/',
    colorClass: 'indigo',
    backgroundColor: 'rgb(224 231 255)', // indigo-100
    borderBottom: 'solid rgb(129 140 248)', // indigo-400
  },
  collections: {
    label: {
      singular: 'collection',
      plural: 'collections',
    },
    prefix: '^',
    colorClass: 'amber',
    backgroundColor: 'rgb(254 243 199)', // amber-100
    // borderBottom: 'solid rgb(245 158 11)', // amber-500
    borderBottom: 'solid rgb(251 191 36)', // amber-400
  },
  images: {
    label: {
      singular: 'image',
      plural: 'images',
    },
    prefix: '~',
    colorClass: 'teal',
    backgroundColor: 'rgb(204 251 241)', // teal-100
    borderBottom: 'solid rgb(45 212 191)', // teal-400
  },
}

export interface MentionValue {
  newValue: string
  newPlainTextValue: string
  mentions: { childIndex: number; display: string; id: string; index: number; plainTextIndex: number }[]
}
