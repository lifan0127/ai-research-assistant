import React, { useState } from 'react'
import { SelectedItem, SelectedCollection, States } from '../../models/utils/states'

export function useStates(inputStates: States = {}) {
  const [states, setStates] = useState<States>(inputStates)

  function addSelectedItems(items: SelectedItem[]) {
    if (states.selectedItems) {
      const existingItemIds = states.selectedItems.map(({ id }) => id)
      const newItems = items.filter(({ id }) => !existingItemIds.includes(id))
      setStates({ selectedItems: [...states.selectedItems, ...newItems] })
    } else {
      setStates({ selectedItems: items })
    }
  }

  function removeSelectedItem(itemId: number) {
    setStates({ selectedItems: (states.selectedItems || []).filter(({ id }) => id !== itemId) })
  }

  function removeAllSelectedItems() {
    setStates({ selectedItems: [] })
  }

  function setSelectedCollection(collection: SelectedCollection) {
    setStates({ selectedCollection: collection })
  }

  function removeSelectedCollection() {
    setStates({ selectedCollection: undefined })
  }

  function resetStates() {
    setStates({ selectedItems: [] })
  }

  return {
    states,
    addSelectedItems,
    removeSelectedItem,
    removeAllSelectedItems,
    setSelectedCollection,
    removeSelectedCollection,
    resetStates,
  }
}
