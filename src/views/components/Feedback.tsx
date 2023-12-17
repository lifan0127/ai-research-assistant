import React, { useRef } from 'react'
import { Modal } from './menu/Modal'
import { config } from '../../../package.json'

interface FeedbackProps {
  open: boolean
  setOpen: (open: boolean) => void
  callback?: () => void
}

export function Feedback({ open, setOpen, callback }: FeedbackProps) {
  const emailRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  if (!open) {
    return null
  }

  async function handleSubmit() {
    Zotero.Prefs.set(`${config.addonRef}.USER_EMAIL`, emailRef.current?.value || '')
    Zotero.Prefs.set(`${config.addonRef}.FEEDBACK_NO_CONFIRMATION`, confirmRef.current?.checked === true)
    callback && (await callback())
    setOpen(false)
  }

  return (
    <Modal>
      <div>
        {/* <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div> */}
        <div className="mt-3 sm:mt-5">
          <h3 className="text-center text-xl font-semibold leading-6 text-gray-900">Thank you for your feedback!</h3>
          <div>
            <p className="text-sm text-gray-500">You are about to share this chat session to help improve Aria.</p>
          </div>
          <div>
            <div>
              <p className="text-sm text-gray-500">For contact, please provide your email. (Optional)</p>
              <input
                ref={emailRef}
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                placeholder="name@example.com"
                defaultValue={Zotero.Prefs.get(`${config.addonRef}.USER_EMAIL`) as string}
                className="w-full mb-2 sm:mb-4 rounded-md border-0 box-border text-gray-900 shadow-sm bg-white ring-1 ring-inset ring-gray-300 px-2 py-1 placeholder:text-gray-400 sm:text-smR"
              />
            </div>
          </div>
          <div>
            <div>
              <div className="inline-block align-middle">
                <input
                  ref={confirmRef}
                  id="auto-submission"
                  name="auto-submission"
                  type="checkbox"
                  defaultChecked={Zotero.Prefs.get(`${config.addonRef}.FEEDBACK_NO_CONFIRMATION`) as boolean}
                  className="h-4 w-4 m-0 rounded border-neutral-300 accent-white"
                />
              </div>
              <div className="ml-3 text-sm leading-4 inline-block">
                <label htmlFor="auto-submission" className="font-medium text-gray-900">
                  Submit future feedback without confirmation
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 sm:mt-4 flex flex-col md:flex-row w-full space-y-4 md:space-x-4 md:space-y-0">
        <button
          type="button"
          className="flex-auto rounded-md bg-tomato px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
          onClick={handleSubmit}
        >
          Confirm
        </button>
        <button
          type="button"
          className="flex-auto rounded-md bg-neutral-400 px-3 py-2 text-sm font-semibold text-white shadow-sm border-none"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
