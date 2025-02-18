import React, { useState, useEffect } from "react"
import {
  SearchActionStepContent,
  SearchWorkflowStepContent,
  WorkflowStepControl,
} from "../../../../typings/steps"
import { workflow as log } from "../../../../utils/loggers"
import type { recursiveSearchAndCompileResults } from "../../../../apis/zotero/search"
import { invoke } from "lodash"

interface SearchWorkflowProps {
  content: SearchWorkflowStepContent
  control: WorkflowStepControl
}

export function SearchWorkflow({
  content,
  control: { scrollToEnd, pauseScroll, getBotStep, addBotStep, updateBotStep },
}: SearchWorkflowProps) {
  useEffect(() => {
    async function invokeSearchAction() {
      await addBotStep(content.messageId, {
        type: "ACTION_STEP",
        params: {
          action: {
            type: "search",
            mode: "search",
          },
          workflow: {
            type: "search",
            messageId: content.messageId,
            stepId: content.id,
          },
        },
      })
    }
    async function addSearchResultsStep() {
      // const searchResultsBotStep = getBotStep(
      //   content.messageId,
      //   content.params.searchResultsStepId!,
      // ) as SearchActionStepContent
      // log("Search results", { searchResultsBotStep })
      await addBotStep(content.messageId, {
        type: "MESSAGE_STEP",
        status: "COMPLETED",
        params: {
          messages: [
            {
              type: "WIDGET",
              params: {
                widget: "search",
                message: {
                  query: content.params.context.query,
                  searchResultsStepId: content.params.searchResultsStepId!,
                },
              },
            },
          ],
        },
      })
    }
    if (content.status !== "COMPLETED") {
      if (!content.params.searchResultsStepId) {
        invokeSearchAction()
      } else {
        addSearchResultsStep()
        updateBotStep(content.messageId, content.id, { status: "COMPLETED" })
      }
    }
  }, [content])

  const { messageId, id, status, params } = content

  return null
  // return (
  //   <div>
  //     <h1>SearchWorkflowStep</h1>
  //     <div>Status: {status}</div>
  //     <div>MessageId: {messageId}</div>
  //     <div>id: {id}</div>
  //     <div>Params: {JSON.stringify(params)}</div>
  //   </div>
  // )
}
