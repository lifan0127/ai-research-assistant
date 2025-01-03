import React, { useState, useRef } from "react"
import { ErrorStepInput } from "../../../../typings/steps"
import { Message as OpenAIMessage } from "openai/resources/beta/threads/messages"
import { DocumentIcon } from "@heroicons/react/24/outline"
import * as Markdown from "../actions/Markdown"
import { parsePartialJson } from "../../../../utils/parsers"
import { StepControl } from "../../../../typings/steps"
import * as Error from "../actions/Error"

export interface ErrorStepProps {
  input: ErrorStepInput
  control: StepControl
}

export function ErrorStep({ input, control }: ErrorStepProps) {
  const { error } = input

  return <Error.Component input={{ error }} control={control} />
}
