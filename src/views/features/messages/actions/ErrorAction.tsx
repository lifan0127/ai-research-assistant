import React, { useState, useEffect } from "react"
import * as Markdown from "./Markdown"
import { serializeError } from "serialize-error"
import { marked } from "marked"
import { anonymizeError } from "../../../../models/utils/error"
import { config } from "../../../../../package.json"
import { FilePickerHelper } from "zotero-plugin-toolkit"
import { copyButtonDef } from "../../../components/buttons/types"
import { Link } from "../../../components/buttons/Link"
import { Control } from "../../../components/types"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import { ErrorActionStepControl } from "../../../../typings/actions"

interface ContainerProps {
  error: Error
  children: React.ReactNode
}

function ErrorActionContainer({ error, children }: ContainerProps) {
  const [showError, setShowError] = useState(false)
  if (
    __env__ === "production" &&
    error.stack &&
    typeof error.stack === "string"
  ) {
    error.stack = anonymizeError(error.stack)
  }

  function handleShowError(event: React.MouseEvent) {
    event.preventDefault()
    setShowError(!showError)
  }

  return (
    <>
      <div>{children}</div>
      <a
        href="#"
        className="text-gray-500 !mt-2 no-underline"
        onClick={handleShowError}
      >
        {showError ? "– Hide" : "+ Show"} error stack
      </a>
      {showError ? (
        <CodeHighlighter
          code={stringify(error)}
          language="json"
          className="text-sm"
        />
      ) : null}
    </>
  )
}

export interface Content {
  status: "COMPLETED" | "IN_PROGRESS"
  error: any
}

export interface ErrorActionProps {
  content: Content
  control: ErrorActionStepControl
}

export function ErrorAction({ content: { error }, control }: ErrorActionProps) {
  const { scrollToEnd } = control
  const OPENAI_MODEL =
    (Zotero.Prefs.get(`${config.addonRef}.OPENAI_MODEL`) as string) || "gpt-4o"

  useEffect(() => {
    scrollToEnd()
  }, [error])

  async function saveMessageHistoryFile(file: string) {
    const filename = await new FilePickerHelper(
      `${Zotero.getString("fileInterface.import")} JSONL Document`,
      "save",
      [["JSONL File(*.jsonl)", "*.jsonl"]],
      file.split("/").pop(),
    ).open()
    if (filename) {
      const fileContent = (await Zotero.File.getContentsAsync(
        file,
        "utf-8",
      )) as string
      await Zotero.File.putContentsAsync(filename, fileContent)
    }
  }

  // For errors that don't have the 'insufficient_quota' code from OpenAI
  if (error && error.name) {
    switch (error.name) {
      case "InsufficientQuotaError": {
        return (
          <ErrorActionContainer error={error}>
            <div>
              <h4 className="pb-2">
                You exceeded your current quota with OpenAI APIs.
              </h4>
              <p>
                Your request has been rejected by OpenAI due to insufficient
                quota.
              </p>
              <p>
                Please check out this{" "}
                <Link
                  url={
                    "https://help.openai.com/en/articles/6891831-error-code-429-you-exceeded-your-current-quota-please-check-your-plan-and-billing-details"
                  }
                  text="OpenAI support article"
                />{" "}
                for more details.
              </p>
            </div>
          </ErrorActionContainer>
        )
      }
    }
  }
  if (error && error.code) {
    switch (error.code) {
      case "invalid_api_key": {
        return (
          <ErrorActionContainer error={error}>
            <div>
              <h4 className="pb-2">
                Valid OpenAI API key is required to use Aria
              </h4>
              <ul className="list-none p-0">
                <li>
                  Select <strong>Edit</strong> from the top menu bar, and then
                  select <strong>Preferences</strong> from the dropdown menu.
                </li>
                <li>
                  On the top panel or the left-hand side panel, select{" "}
                  <strong>Aria</strong>.
                </li>
                <li>
                  Locate the <strong>OpenAI API key</strong> field and enter
                  your API key in the text box.
                </li>
                <li>
                  Click the <strong>Close</strong> button to save your chagne
                  and <strong>restart Zotero</strong>
                </li>
              </ul>
            </div>
          </ErrorActionContainer>
        )
      }
      case "model_not_found": {
        const supportArticleUrl =
          "https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4"
        return (
          <ErrorActionContainer error={error}>
            <div>
              <h4 className="pb-2">Model '{OPENAI_MODEL}' is not available</h4>
              <ul className="list-none p-0">
                <li>{`The model '${OPENAI_MODEL}' does not exist or you do not have access to it.`}</li>
                <li>
                  Learn more:{" "}
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
          </ErrorActionContainer>
        )
      }
      case "load_message_history_error": {
        return (
          <ErrorActionContainer error={error}>
            <div>
              <h4 className="pb-2">Unable to parse your message history</h4>
              <ul className="list-none p-0">
                <li>
                  Unfortunately, your message history may have been corrupted
                  and cannot be loaded into {config.addonName}.
                </li>
                <li>
                  <button
                    className="inline p-0 whitespace-nowrap border-none text-tomato bg-transparent hover:underline"
                    onClick={async () =>
                      await saveMessageHistoryFile(error.file)
                    }
                  >
                    Click here to download a copy of your message history for
                    troubleshooting.
                  </button>
                </li>
              </ul>
            </div>
          </ErrorActionContainer>
        )
      }
    }
  }
  return (
    <ErrorActionContainer error={error}>
      <Markdown.Component
        content={{
          status: "COMPLETED",
          text: `Apologies for the inconvenience. Something has gone wrong within ${config.addonName}. Please check the error stack for detailed
        information about the issue.`,
        }}
        control={control}
      />
    </ErrorActionContainer>
  )
}

export function compileContent({ input: { error } }: ErrorActionProps) {
  const textContent =
    "<pre>" + JSON.stringify(serializeError(error), null, 2) + "</pre>"
  const htmlContent = marked(textContent)
  return { textContent, htmlContent }
}

function copy(props: ErrorActionProps) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard()
    .addText(textContent, "text/unicode")
    .addText(htmlContent, "text/html")
    .copy()
}

export const buttonDefs = [
  {
    name: "COPY",
    utils: { copy },
  } as copyButtonDef,
]
