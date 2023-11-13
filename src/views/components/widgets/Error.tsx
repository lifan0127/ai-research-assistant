import React, { useState } from 'react'
import { Markdown } from './Markdown'
import { serializeError } from 'serialize-error'
import { marked } from 'marked'
import { anonymizeError } from '../../../models/utils/error'
import { config } from '../../../../package.json'
interface ErrorContainerProps {
  error: any
  children: React.ReactNode
}

function ErrorContainer({ error, children }: ErrorContainerProps) {
  const [showError, setShowError] = useState(false)
  if (__env__ === 'production' && error.stack && typeof error.stack === 'string') {
    error.stack = anonymizeError(error.stack)
  }

  return (
    <>
      <div>{children}</div>
      <div className="text-gray-500 !mt-2" onClick={() => setShowError(!showError)}>
        {showError ? '– Hide' : '+ Show'} error stack
      </div>
      {showError ? (
        <pre className="overflow-auto !leading-tight text-xs max-h-64 !p-2 bg-gray-200/50">
          {JSON.stringify(error, null, 2)}
        </pre>
      ) : null}
    </>
  )
}

export interface ErrorProps {
  error: any
}

export function Error({ error }: ErrorProps) {
  const OPENAI_MODEL = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || 'gpt-4-0613'

  if (error?.response?.data?.error) {
    const { code, message } = error.response.data.error
    switch (code) {
      case 'invalid_api_key': {
        return (
          <ErrorContainer error={error}>
            <div>
              <h4 className="pb-2">OpenAI API key is required to use Aria</h4>
              <ul className="list-none p-0">
                <li>
                  Select <em>Edit</em> from the top menu bar, and then select <em>Preferences</em> from the dropdown
                  menu.
                </li>
                <li>
                  On the top panel or the left-hand side panel, select <em>Aria</em>.
                </li>
                <li>
                  Locate the <em>OpenAI API key</em> field and enter your API key in the text box.
                </li>
                <li>
                  Click the <em>Close</em> button to save your chagne and <strong>restart Zotero</strong>
                </li>
              </ul>
            </div>
          </ErrorContainer>
        )
      }
      case 'model_not_found': {
        const supportArticleUrl = 'https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4'
        return (
          <ErrorContainer error={error}>
            <div>
              <h4 className="pb-2">Model '{OPENAI_MODEL}' is not available</h4>
              <ul className="list-none p-0">
                <li>{`The model '${OPENAI_MODEL}' does not exist or you do not have access to it.`}</li>
                <li>
                  Learn more:{' '}
                  <button
                    className="inline p-0 whitespace-nowrap border-none text-tomato bg-transparent hover:underline"
                    onClick={() => Zotero.launchURL(supportArticleUrl)}
                  >
                    {supportArticleUrl}
                  </button>
                  .
                </li>
              </ul>
            </div>
          </ErrorContainer>
        )
      }
    }
  }
  console.log({ error })
  return (
    <ErrorContainer error={error}>
      <Markdown
        content="Apologies for the inconvenience. Something has gone wrong within Aria. Please check the error stack for detailed
        information about the issue."
      />
    </ErrorContainer>
  )
}

export function copyError({ error }: ErrorProps) {
  const textContent = '<pre>' + JSON.stringify(serializeError(error), null, 2) + '</pre>'
  const htmlContent = marked(textContent)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}
