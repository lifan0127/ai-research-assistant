import React, { useState, useCallback } from 'react'
import { FEEDBACK_URL } from '../../constants'
import { config } from '../../../package.json'
import { BotMessageProps, FeedbackContent } from '../components/message/types'

export function useFeedback() {
  const [openFeedback, setOpenFeedback] = useState(false)
  const [callback, setCallback] = useState<() => void>()

  const submitRequest = useCallback(async (content: FeedbackContent) => {
    try {
      const res = await fetch(FEEDBACK_URL, {
        method: 'POST',
        body: JSON.stringify(content),
      })
      if (res.status === 200) {
        return true
      }
      return false
    } catch (error) {
      console.log({ error })
      return false
    }
  }, [])

  async function submit(
    content: FeedbackContent,
    editMessageVote: (vote: 'up' | 'down') => void,
    callback: (success: boolean) => void
  ) {
    const noConfirmation = Zotero.Prefs.get(`${config.addonRef}.FEEDBACK_NO_CONFIRMATION`)
    if (noConfirmation) {
      const user = Zotero.Prefs.get(`${config.addonRef}.USER_EMAIL`) as string
      content.user = user !== '' ? user : null
      const success = await submitRequest(content)
      if (success) {
        editMessageVote(content.vote)
      }
      callback(success)
    } else {
      setOpenFeedback(true)
      setCallback(() => async () => {
        const user = Zotero.Prefs.get(`${config.addonRef}.USER_EMAIL`) as string
        content.user = user !== '' ? user : null
        const success = await submitRequest(content)
        if (success) {
          editMessageVote(content.vote)
        }
        callback(success)
      })
    }
  }

  return {
    submitFeedback: submit,
    openFeedback,
    setOpenFeedback,
    submitCallback: callback,
  }
}
