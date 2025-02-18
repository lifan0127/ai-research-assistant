import React, { useEffect } from "react"
import { ActionStepContent, ActionStepControl } from "../../../../typings/steps"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import stringify from "json-stringify-pretty-compact"
import { SearchAction } from "../actions/SearchAction"
import { FileAction } from "../actions/FileAction"
import { QAAction } from "../actions/QAAction"
import { RetryAction } from "../actions/RetryAction"

export interface ActionStepProps {
  content: ActionStepContent
  control: ActionStepControl
}

export function ActionStep({ content, control }: ActionStepProps) {
  switch (content.params.action.type) {
    case "search": {
      return <SearchAction content={content} control={control} />
    }
    case "file": {
      return <FileAction content={content} control={control} />
    }
    case "qa": {
      return <QAAction content={content} control={control} />
    }
    case "retry": {
      return <RetryAction content={content} control={control} />
    }
    default: {
      return <CodeHighlighter code={stringify(content)} language="json" />
    }
  }
}
