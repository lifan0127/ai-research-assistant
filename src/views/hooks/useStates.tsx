import React, { useState, useEffect } from 'react'
import { find } from 'lodash'
import { uniqBy, groupBy } from 'lodash'
import {
  SelectedCreator,
  SelectedTag,
  SelectedItem,
  SelectedCollection,
  States,
  StateName,
  StateSelection,
  StateSelections,
  selectionConfig,
  MentionValue,
} from '../../models/utils/states'
import * as zot from '../../apis/zotero'
import { title } from 'process'

export const defaultStates: States = {
  creators: [],
  tags: [],
  items: [],
  collections: [],
  images: [],
}

export const defaultValue: MentionValue = {
  newValue: '',
  newPlainTextValue: '',
  mentions: [],
}

export function useStates(inputStates: States = defaultStates, inputValue: MentionValue = defaultValue) {
  const [states, setStates] = useState<States>(inputStates)
  const [value, setValue] = useState<MentionValue>(inputValue)

  useEffect(() => {
    async function updateStates() {
      // console.log({ mentions: value.mentions })
      // Group mentions by type
      const mentionsByType = groupBy(
        uniqBy(value.mentions, mention => mention.id).map(mention => mention.id.split('|')),
        ([type]) => type
      )

      // Handle mentioned items
      const itemIds = states.items.map(item => item.id)
      const mentionedItemIds = (mentionsByType.items || []).map(([, id]) => parseInt(id))
      const newItems = await Promise.all(
        mentionedItemIds.filter(id => !itemIds.includes(id)).map(async id => await zot.getItemById(id))
      )
      const remainingItems = states.items.filter(item => mentionedItemIds.includes(item.id))
      const items = [...remainingItems, ...newItems]

      // Handle mentioned collections
      const collectionIds = states.collections.map(collection => collection.id)
      const mentionedCollectionIds = (mentionsByType.collections || []).map(([, id]) => parseInt(id))
      const newCollections = await Promise.all(
        mentionedCollectionIds
          .filter(id => !collectionIds.includes(id))
          .map(async id => {
            const { title } = await zot.getCollectionById(id)
            return { id, type: 'collection' as const, title }
          })
      )
      const remainingCollections = states.collections.filter(collection =>
        mentionedCollectionIds.includes(collection.id)
      )
      const collections = [...remainingCollections, ...newCollections]

      // Handle mentioned tags
      const tags = (mentionsByType.tags || []).map(([, id]) => ({
        id,
        title: Zotero.Utilities.Internal.Base64.decode(id),
        type: 'tag' as const,
      }))

      // Handle mentioned creators
      const creators = (mentionsByType.creators || []).map(([, id]) => ({
        id,
        title: Zotero.Utilities.Internal.Base64.decode(id),
        type: 'creator' as const,
      }))

      // Handle mentioned images
      const images = (mentionsByType.images || []).map(([display, id]) => {
        const image = states.images.find(image => image.id === id)!.image
        return {
          id: id,
          title: display,
          type: 'image' as const,
          image,
        }
      })

      // Reset states
      reset({ ...states, items, collections, tags, creators, images }, value)
    }
    updateStates()
  }, [value.mentions])

  // For individual selection, match by id
  // For selections by type, match by id prefix
  function matcherFactory(selection?: StateSelection) {
    return !!selection
      ? (name: StateName, mention: MentionValue['mentions'][0]) => mention.id === `${name}|${selection.id}`
      : (name: StateName, mention: MentionValue['mentions'][0]) => mention.id.startsWith(`${name}|`)
  }

  function removeMentions(name: StateName, selection?: StateSelection) {
    const matcher = matcherFactory(selection)
    // Divide mentions into matches and others
    const { matches, others } = value.mentions.reduce(
      (all: { matches: MentionValue['mentions']; others: MentionValue['mentions'] }, mention) => {
        if (matcher(name, mention)) {
          return { ...all, matches: [...all.matches, mention] }
        } else {
          return { ...all, others: [...all.others, mention] }
        }
      },
      { matches: [], others: [] }
    )
    let { newValue, newPlainTextValue } = value
    // For each match, update value, plainTextValue and mentions.
    for (let match of matches.reverse()) {
      // Remove extra whitespace surrounding the removed mention, if necessary
      const hasExtraWhiteSpace =
        (match.index === 0 || newPlainTextValue[match.plainTextIndex - 1] === ' ') &&
        (match.plainTextIndex === newPlainTextValue.length - 1 ||
          newPlainTextValue[match.plainTextIndex + match.display.length] === ' ')
      const mentionLength = newValue.slice(match.index).indexOf(match.id) + match.id.length + 1
      const plainTextMentionLength = match.display.length
      // Calculate the mention lengths for removal by slice
      const mentionOffset = hasExtraWhiteSpace ? mentionLength + 1 : mentionLength
      const plainTextMentionOffset = hasExtraWhiteSpace ? plainTextMentionLength + 1 : plainTextMentionLength
      // For each match, remove its reference in value and plainTextValue
      newValue = newValue.slice(0, match.index) + newValue.slice(match.index + mentionOffset)
      newPlainTextValue =
        newPlainTextValue.slice(0, match.plainTextIndex) +
        newPlainTextValue.slice(match.plainTextIndex + plainTextMentionOffset)
      // Update the index of other mentions
      others.forEach(mention => {
        if (mention.index > match.index) {
          mention.index -= mentionOffset
        }
        if (mention.plainTextIndex > match.plainTextIndex) {
          mention.plainTextIndex -= plainTextMentionOffset
        }
      })
    }
    setValue({ newValue, newPlainTextValue, mentions: others })
  }

  function add(name: StateName, selections: StateSelection[]) {
    // Update selection
    const newSelections = selections.reduce((all: typeof selections, ind) => {
      const match = find(states[name], { id: ind.id }) as StateSelection | undefined
      if (match !== undefined) {
        return all
      }
      return [...all, ind]
    }, [])
    setStates({ ...states, [name]: [...states[name], ...newSelections] })

    // Add mentions
    let { newValue, newPlainTextValue, mentions } = value
    for (let selection of selections) {
      const id = `${name}|${selection.id}`
      const display =
        name === 'items' && selection?.title && selection.title.length > 32
          ? selection.title.slice(0, 32) + '...'
          : (selection.title as string)
      mentions = [
        ...mentions,
        { childIndex: 2, id, display, index: newValue.length, plainTextIndex: newPlainTextValue.length },
      ]
      newValue += `${selectionConfig[name].prefix}` + `[${selection.title}](${id})` + ' '
      newPlainTextValue += display + ' '
    }
    setValue({ newValue, newPlainTextValue, mentions })
  }

  function remove(name: StateName, selection: StateSelection) {
    const selections = states[name] as Pick<StateSelection, 'id'>[]
    setStates({ ...states, [name]: selections.filter(({ id }) => id !== selection.id) })
    removeMentions(name, selection)
  }

  function removeAll(name: StateName) {
    setStates({ ...states, [name]: [] })
    removeMentions(name)
  }

  function set(name: StateName, selections: StateSelections) {
    setStates({ ...states, [name]: selections })
  }

  function reset(states: States = defaultStates, inputValue: MentionValue = defaultValue) {
    setStates(states)
    setValue(inputValue)
  }

  return {
    states,
    add,
    remove,
    removeAll,
    set,
    reset,
    value,
    setValue,
  }
}
