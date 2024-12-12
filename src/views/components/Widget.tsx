import React from "react"
import * as Markdown from "../features/message/widgets/Markdown"
import * as Search from "../features/message/widgets/Search"
import * as QA from "../features/message/widgets/QA"
import * as Error from "../features/message/widgets/Error"
import { Control } from "./types"

export interface WidgetProps {
  widget: "markdown" | "search" | "qa" | "error"
  input: Markdown.Input | Search.Input | QA.Input | Error.Input
  context: any
  control: Control
}

export function Widget({ widget, input, context, control }: WidgetProps) {
  switch (widget) {
    case "markdown": {
      return (
        <Markdown.Component input={input as Markdown.Input} control={control} />
      )
    }
    case "search": {
      return (
        <Search.Component
          input={input as Search.Input}
          context={context}
          control={control}
        />
      )
    }
    case "error": {
      return <Error.Component input={input as Error.Input} control={control} />
    }
    case "qa": {
      return (
        <QA.Component
          input={input as QA.Input}
          context={context}
          control={control}
        />
      )
    }
    default: {
      return (
        <Markdown.Component
          input={{
            content: `Unknown widget: ${widget}. Input: ${JSON.stringify(input)}`,
          }}
          control={control}
        />
      )
    }
  }
}
