import React, { useState, useEffect } from "react"
import {
  QAWorkflowStepContent,
  WorkflowStepControl,
  SearchActionStepContent,
} from "../../../../typings/steps"
import { workflow as log } from "../../../../utils/loggers"
import type { recursiveSearchAndCompileResults } from "../../../../apis/zotero/search"
import { invoke } from "lodash"

interface QAWorkflowProps {
  content: QAWorkflowStepContent
  control: WorkflowStepControl
}

export function QAWorkflow({
  content,
  control: { scrollToEnd, pauseScroll, getBotStep, addBotStep, updateBotStep },
}: QAWorkflowProps) {
  log("QAWorkflow", content)
  useEffect(() => {
    if (content.status !== "COMPLETED") {
      if (!content.params.searchResultsStepId) {
        addBotStep(content.messageId, {
          type: "ACTION_STEP",
          params: {
            action: {
              type: "search",
              mode: content.params.workflow.input.fulltext ? "fulltext" : "qa",
            },
            workflow: {
              type: "qa",
              messageId: content.messageId,
              stepId: content.id,
            },
          },
        })
      } else if (content.params.workflow.input.fulltext) {
        if (content.params.searchResultsCount === 0) {
          addBotStep(content.messageId, {
            type: "ACTION_STEP",
            params: {
              action: {
                type: "retry",
                input: {
                  message: "No search results found.",
                  prompt:
                    "The search query didn't return any results. Please revise and try again.",
                },
              },
              // context: content.params.context,
              workflow: {
                type: "qa",
                messageId: content.messageId,
                stepId: content.id,
              },
            },
          })
        } else {
          if (!content.params.indexed) {
            addBotStep(content.messageId, {
              type: "ACTION_STEP",
              params: {
                action: {
                  type: "file",
                  input: {
                    // files: searchResults.results,
                    searchResultsStepId: content.params.searchResultsStepId,
                  },
                },
                workflow: {
                  type: "qa",
                  messageId: content.messageId,
                  stepId: content.id,
                },
              },
            })
          } else {
            addBotStep(content.messageId, {
              type: "ACTION_STEP",
              params: {
                action: {
                  type: "qa",
                  input: {
                    question: content.params.workflow.input.question,
                    fulltext: content.params.workflow.input.fulltext,
                  },
                },
                workflow: {
                  type: "qa",
                  messageId: content.messageId,
                  stepId: content.id,
                },
              },
            })
          }
        }
      } else {
        log("QAWorkflow complete", { content })
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
