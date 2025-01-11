import React, { useState, useRef } from "react"
import { ErrorStepContent } from "../../../../typings/steps"
import { Message as OpenAIMessage } from "openai/resources/beta/threads/messages"
import { DocumentIcon } from "@heroicons/react/24/outline"
import * as Markdown from "../actions/Markdown"
import { parsePartialJson } from "../../../../utils/parsers"
import { ErrorStepControl } from "../../../../typings/steps"
import * as Error from "../actions/Error"

export interface ErrorStepProps {
  content: ErrorStepContent
  control: ErrorStepControl
}

export function ErrorStep({ content, control }: ErrorStepProps) {
  const { error } = content

  return <Error.Component content={{ error }} control={control} />
}
