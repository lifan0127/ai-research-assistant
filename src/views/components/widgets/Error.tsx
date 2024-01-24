import React, { useState } from 'react'
import * as Markdown from './Markdown'
import { serializeError } from 'serialize-error'
import { marked } from 'marked'
import { anonymizeError } from '../../../models/utils/error'
import { config } from '../../../../package.json'
import { FilePickerHelper } from 'zotero-plugin-toolkit/dist/helpers/filePicker'
import { copyButtonDef } from '../buttons/types'
import { Link } from '../buttons/Link'

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
  const OPENAI_MODEL = (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || 'gpt-4-1106-preview'

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

  // For errors that don't have the 'insufficient_quota' code from OpenAI
  if (error && error.name) {
    switch (error.name) {
      case 'InsufficientQuotaError': {
        return (
          <Container error={error}>
            <div>
              <h4 className="pb-2">You exceeded your current quota with OpenAI APIs.</h4>
              <p>Your request has been rejected by OpenAI due to insufficient quota.</p>
              <p>
                Please check out this{' '}
                <Link
                  url={
                    'https://help.openai.com/en/articles/6891831-error-code-429-you-exceeded-your-current-quota-please-check-your-plan-and-billing-details'
                  }
                  text="OpenAI support article"
                />{' '}
                for more details.
              </p>
            </div>
          </Container>
        )
      }
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
                <li>
                  Unfortunately, your message history may have been corrupted and cannot be loaded into{' '}
                  {config.addonName}.
                </li>
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
        content={`Apologies for the inconvenience. Something has gone wrong within ${config.addonName}. Please check the error stack for detailed
        information about the issue.`}
      />
    </Container>
  )
}

export function compileContent({ error }: Props) {
  const textContent = '<pre>' + JSON.stringify(serializeError(error), null, 2) + '</pre>'
  const htmlContent = marked(textContent)
  return { textContent, htmlContent }
}

function copy(props: Props) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard().addText(textContent, 'text/unicode').addText(htmlContent, 'text/html').copy()
}

export const buttonDefs = [
  {
    name: 'COPY',
    utils: { copy },
  } as copyButtonDef,
]
