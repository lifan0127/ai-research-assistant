import React, { useState } from 'react'
import * as Markdown from './Markdown'
import { serializeError } from 'serialize-error'
import { marked } from 'marked'
import { anonymizeError } from '../../../models/utils/error'
import { config } from '../../../../package.json'
import { FilePickerHelper } from 'zotero-plugin-toolkit/dist/helpers/filePicker'
interface ContainerProps {
  error: any
  children: React.ReactNode
}

function Container({ error, children }: ContainerProps) {
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

export interface Props {
  error: any
}

export function Component({ error }: Props) {
  const OPENAI_MODEL = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || 'gpt-4-0613'

  async function saveMessageHistoryFile(file: string) {
    const filename = await new FilePickerHelper(
      `${Zotero.getString('fileInterface.import')} JSONL Document`,
      'save',
      [['JSONL File(*.jsonl)', '*.jsonl']],
      file.split('/').pop()
    ).open()
    if (filename) {
      const content = (await Zotero.File.getContentsAsync(file, 'utf-8')) as string
      await Zotero.File.putContentsAsync(filename, content)
    }
  }

  if (error && error.code) {
    switch (error.code) {
      case 'invalid_api_key': {
        return (
          <Container error={error}>
            <div>
              <h4 className="pb-2">Valid OpenAI API key is required to use Aria</h4>
              <ul className="list-none p-0">
                <li>
                  Select <strong>Edit</strong> from the top menu bar, and then select <strong>Preferences</strong> from
                  the dropdown menu.
                </li>
                <li>
                  On the top panel or the left-hand side panel, select <strong>Aria</strong>.
                </li>
                <li>
                  Locate the <strong>OpenAI API key</strong> field and enter your API key in the text box.
                </li>
                <li>
                  Click the <strong>Close</strong> button to save your chagne and <strong>restart Zotero</strong>
                </li>
              </ul>
            </div>
          </Container>
        )
      }
      case 'model_not_found': {
        const supportArticleUrl = 'https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4'
        return (
          <Container error={error}>
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
          </Container>
        )
      }
      case 'load_message_history_error': {
        return (
          <Container error={error}>
            <div>
              <h4 className="pb-2">Unable to parse your message history</h4>
              <ul className="list-none p-0">
                <li>Unfortunately, your message history may have been corrupted and cannot be loaded into Aria.</li>
                <li>
                  <button
                    className="inline p-0 whitespace-nowrap border-none text-tomato bg-transparent hover:underline"
                    onClick={async () => await saveMessageHistoryFile(error.file)}
                  >
                    Click here to download a copy of your message history for troubleshooting.
                  </button>
                </li>
              </ul>
            </div>
          </Container>
        )
      }
    }
  }
  return (
    <Container error={error}>
      <Markdown.Component
        content="Apologies for the inconvenience. Something has gone wrong within Aria. Please check the error stack for detailed
        information about the issue."
      />
    </Container>
  )
}

function copy({ error }: Props) {
  const textContent = '<pre>' + JSON.stringify(serializeError(error), null, 2) + '</pre>'
  const htmlContent = marked(textContent)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}

export const actions = [
  {
    label: 'Copy',
    action: copy,
  },
]
