import React, { useState, useRef } from "react"
import { StepInput } from "./types"
import { Message as OpenAIMessage } from "openai/resources/beta/threads/messages"
import { DocumentIcon } from "@heroicons/react/24/outline"
import * as Markdown from "../widgets/Markdown"
import { parsePartialJson } from "../../../../utils/parsers"
import { Control } from "../../../components/types"
import { Widget, WidgetProps } from "../../../components/Widget"

export interface ErrorStepInput extends StepInput {
  type: "ERROR_STEP"
  error: Error
}

export interface ErrorStepProps {
  input: ErrorStepInput
  control: Control
}

export function ErrorStep({ input, control }: ErrorStepProps) {
  const { error } = input

  return <Widget widget="error" input={{ error: error }} control={control} />
}
