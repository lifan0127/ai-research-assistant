import { serializeError } from "serialize-error"
import OpenAI from "openai"
import { MessageCreateParams } from "openai/resources/beta/threads/messages"
import { Routes, createRouter, createRouteFunctions } from "./chains/router"
import { loadSearchChain } from "./chains/search"
import { loadRetrievalQAChain } from "./chains/qa"
import { ZoteroCallbacks, ErrorCallbacks } from "./utils/callbacks"
import { simplifyStates, serializeStates } from "./utils/states"
import { loadVisionChain } from "./chains/vision"
import { getPref, setPref, clearPref } from "../utils/prefs"
import { routingFormat } from "./schemas/routing"
import { config } from "../../package.json"
import { AssistantStream } from "openai/lib/AssistantStream"
import { MessageStore } from "../utils/messageStore"
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs"
import { RunStep } from "openai/resources/beta/threads/runs/steps"
import { FilePurpose } from "openai/resources"
import { Uploadable, FileLike, BlobLike } from "openai/uploads"
import { Text } from "openai/resources/beta/threads/messages"
import { assistant as log } from "../utils/loggers"
import { only } from "node:test"
import { createCitations } from "../apis/zotero/citation"
import chunk from "lodash/chunk"
import * as db from "../db/client"
import { SimplifiedStates, UserInput } from "../typings/input"

interface AssistantIds {
  routing: string
  file: string
  // coding: string
}

interface ModelSet {
  default: string
}

interface ResearchAssistantFields {
  assistants: AssistantIds
  models: ModelSet
  messageStore: MessageStore
}

export class ResearchAssistant {
  assistants: AssistantIds
  models: ModelSet
  currentThread?: string
  currentRun?: string
  currentVectorStore?: string
  openai: OpenAI
  streams: AssistantStream[] = []

  constructor({ assistants, models }: ResearchAssistantFields) {
    this.assistants = assistants
    this.models = models
    this.openai = new OpenAI({
      apiKey: getPref("OPENAI_API_KEY") as string,
    })
  }

  setThread(threadId: string) {
    this.currentThread = threadId
  }

  setVectorStore(vectorStoreId: string) {
    this.currentVectorStore = vectorStoreId
  }

  streamMessage(contentValue: string, states: SimplifiedStates) {
    log("Streaming message")
    this.openai.beta.threads.messages.create(this.currentThread!, {
      role: "user",
      content: `${serializeStates(states)}Message: ${contentValue}`,
    })
    const stream = this.openai.beta.threads.runs.stream(this.currentThread!, {
      assistant_id: this.assistants.routing,
      model: this.models.default,
      // reasoning_effort: "medium",
      response_format: routingFormat,
      additional_instructions: `Today is ${new Date().toDateString()}`,
    })
    stream.once("runStepCreated", (runStep: RunStep) => {
      this.currentRun = runStep.run_id
    })
    this.streams.push(stream)
    return stream
  }

  streamTools(toolOutputs: RunSubmitToolOutputsParams.ToolOutput[]) {
    log("Streaming tool response")
    const stream = this.openai.beta.threads.runs.submitToolOutputsStream(
      this.currentThread!,
      this.currentRun as string,
      { tool_outputs: toolOutputs },
    )
    this.streams.push(stream)
    return stream
  }

  streamQA(question: string) {
    log("Streaming QA output")
    this.openai.beta.threads.messages.create(this.currentThread!, {
      role: "user",
      content: question,
    })
    const stream = this.openai.beta.threads.runs.stream(this.currentThread!, {
      assistant_id: this.assistants.file,
      model: this.models.default,
      // reasoning_effort: "medium",
      additional_instructions: `Today is ${new Date().toDateString()}. You should ground the question in the provided context or through file_search in user's Zotero library.`,
    })
    this.streams.push(stream)
    return stream
  }

  async getFileMetadata(fileId: string) {
    // Check file id in file cache
    const existingMetadata = await db.getFile(fileId)
    log(`Existing metadata for ${fileId}`, existingMetadata)
    if (existingMetadata) {
      return existingMetadata
    }
    const { filename } = await this.openai.files.retrieve(fileId)
    const [itemId, attachmentId] = filename.split(";")
    log(`Retrieved metadata for ${fileId}`, { itemId, attachmentId })
    const item = await Zotero.Items.getAsync(parseInt(itemId))
    const fileInfo = ztoolkit.ExtraField.getExtraField(item, "aria.file")
    const vectorStoreStr = fileInfo!.split(";")[2]
    const vectorStoreIds = vectorStoreStr ? vectorStoreStr.split(",") : []
    const citations = await createCitations([item.id])
    const attachment = await Zotero.Items.getAsync(parseInt(attachmentId))
    const metadata = {
      id: fileId,
      vectorStoreIds,
      itemId: item.id,
      itemType: item.itemType,
      attachmentId: attachment.id,
      attachmentType: attachment.itemType,
      bib: citations[0].bib.replace(/^\(\d+\)\s*/, "").trim(), // Remove leading (1), (2), etc.
      timestamp: new Date().toISOString(),
    }
    await db.upsertFile(metadata)
    return metadata
  }

  async uploadFile(
    item: Zotero.Item,
    attachment: Zotero.Item,
    purpose: FilePurpose,
  ) {
    const filePath = (await attachment.getFilePathAsync()) as string
    const fileContent = await IOUtils.read(filePath)
    const file = new File([fileContent], [item.id, attachment.id, attachment.attachmentFilename].join(";"), {
      type: attachment.attachmentContentType,
    })

    const response = await this.openai.files.create({ file, purpose })
    const newFileId = `${purpose}/${response.id}`
    return newFileId
  }

  registerUploadedFile(item: Zotero.Item, attachment: Zotero.Item, fileId: string) {
    ztoolkit.ExtraField.setExtraField(
      item,
      "aria.file",
      `${attachment.id};${fileId}`,
    )
  }

  async indexFile(fileId: string) {
    const response = await this.openai.beta.vectorStores.files.createAndPoll(
      this.currentVectorStore as string,
      {
        file_id: fileId.split("/")[1],
      },
    )
    if (response.status !== "completed") {
      log(`File indexing failed for ${fileId} in ${this.currentVectorStore}.`)
    }
    return response
  }

  registerIndexedFile(item: Zotero.Item) {
    const fileInfo = ztoolkit.ExtraField.getExtraField(item, "aria.file")
    if (!fileInfo) {
      throw new Error(`The item ${item.id} does not have an aria.file record.`)
    }
    const [attachmentId, fileId, vectorStoreStr] = fileInfo.split(";")
    const vectorStores = vectorStoreStr ? vectorStoreStr.split(",") : []
    if (!vectorStores.includes(this.currentVectorStore as string)) {
      vectorStores.push(this.currentVectorStore as string)
    }
    ztoolkit.ExtraField.setExtraField(
      item,
      "aria.file",
      `${attachmentId};${fileId};${vectorStores.join(",")}`,
    )
  }

  async clearFileIndex(setProgress: (pct: number) => void) {
    const libraries = Zotero.Libraries.getAll()
    const itemIds = (await Promise.all(libraries.map(library => Zotero.Items.getAll(library.libraryID, true, false, true)))).flat()
    let progress = 0
    const totalItems = itemIds.length
    log("Total items", totalItems)
    for (const itemIdBatch of chunk(itemIds, 10)) {
      const items = await Zotero.Items.getAsync(itemIdBatch)
      items.forEach(async item => {
        const fileInfo = ztoolkit.ExtraField.getExtraField(item, "aria.file")
        if (!fileInfo) {
          return
        }
        const [_attachmentId, assistantsFileId, vectorStoreStr] = fileInfo.split(";")
        const fileId = assistantsFileId.startsWith("assistants/") ? assistantsFileId.slice(11) : assistantsFileId
        const vectorStoreIds = vectorStoreStr ? vectorStoreStr.split(",") : []
        // Remove file from vector stores
        const vectorDelStatus = await Promise.all(vectorStoreIds.map(async vectorStoreId => {
          try {
            const { deleted } = await this.openai.beta.vectorStores.files.del(vectorStoreId, fileId)
            if (!deleted) {
              log(`Failed to remove file ${fileId} from vector store ${vectorStoreId}.`)
            }
            return deleted
          } catch (e: any) {
            if (e.status === 404) {
              return true
            }
            throw e
          }
        }))
        const vectorsDeleted = vectorDelStatus.every(Boolean)
        // Delete file
        let fileDeleted
        try {
          const { deleted } = await this.openai.files.del(fileId)
          if (!deleted) {
            log(`Failed to delete file ${fileId}.`)
          }
        } catch (e: any) {
          if (e.status === 404) {
            fileDeleted = true
          } else {
            throw e
          }
        }

        if (vectorsDeleted && fileDeleted) {
          ztoolkit.ExtraField.setExtraField(item, "aria.file", "")
        }
      })
      setProgress((progress += itemIdBatch.length) / totalItems * 100)
      await new Promise(resolve => setTimeout(resolve, 0)) // Yield for UI updates
    }
  }

  async rebuildFileCache(setProgress: (pct: number) => void) {
    db.clearAllFiles()
    const libraries = Zotero.Libraries.getAll()
    const itemIds = (await Promise.all(libraries.map(library => Zotero.Items.getAll(library.libraryID, true, false, true)))).flat()
    let progress = 0
    const totalItems = itemIds.length
    for (const itemIdBatch of chunk(itemIds, 10)) {
      const items = await Zotero.Items.getAsync(itemIdBatch)
      const indexedItems = (await Promise.all(items.map(async item => {
        const fileInfo = ztoolkit.ExtraField.getExtraField(item, "aria.file")
        if (!fileInfo) {
          return
        }
        const [attachmentId, fileId, vectorStoreStr] = fileInfo.split(";")
        const vectorStoreIds = vectorStoreStr ? vectorStoreStr.split(",") : []
        const attachment = await Zotero.Items.getAsync(parseInt(attachmentId))
        return { itemId: item.id, itemType: item.itemType, attachmentId: attachment.id, attachmentType: attachment.itemType, fileId, vectorStoreIds }
      }))).filter(x => !!x)
      const citations = await createCitations(indexedItems.map(x => x.itemId))
      citations.map((citation, i) => {
        const { bib } = citation
        const { itemId, itemType, attachmentId, attachmentType, fileId, vectorStoreIds } = indexedItems[i]
        db.upsertFile({
          id: fileId,
          vectorStoreIds,
          itemId,
          itemType,
          attachmentId,
          attachmentType,
          bib: bib.replace(/^\(\d+\)\s*/, "").trim(),
          timestamp: new Date().toISOString(),
        })
      })
      setProgress((progress += itemIdBatch.length) / totalItems * 100)
      await new Promise(resolve => setTimeout(resolve, 0)) // Yield for UI updates
    }
  }

  abortAll() {
    this.streams.forEach((stream) => stream.abort())
  }

  async parseAnnotatedText(
    { value = "", annotations = [] }: Partial<Text>
  ) {
    const citationMap = new Map()
    let citationCounter = 1
    let lastIndex = 0
    let lastCitationNumber = 0
    const parts = []
    const citations = []

    // Filter and sort annotations by start_index
    const fileCitations = annotations
      .filter((annotation) => annotation.type === "file_citation")
      .sort((a, b) => a.start_index - b.start_index)

    for (const annotation of fileCitations) {
      const { start_index, end_index, file_citation } = annotation
      const beforeText = value.slice(lastIndex, start_index)
      const fileId = file_citation.file_id

      // Add preceding text
      if (beforeText) {
        parts.push(beforeText)
      }

      // Check if the fileId is already in the map
      let citation
      if (citationMap.has(fileId)) {
        citation = citationMap.get(fileId)

      } else {
        // Fetch metadata
        const metadata = await this.getFileMetadata(fileId)
        const number = citationCounter++
        citation = { number, metadata }
        citationMap.set(fileId, citation)
        citations.push(citation)
      }

      if (citation.number !== lastCitationNumber || beforeText !== "") {
        // Add citation reference
        parts.push(` [[${citation.number}]](aria://items/${citation.metadata.itemType}/${citation.metadata.itemId})`)
        lastCitationNumber = citation.number
      }

      lastIndex = end_index
    }

    // Add any remaining text after the last annotation
    if (lastIndex < value.length) {
      parts.push(value.slice(lastIndex))
    }

    // Combine parts into the final Markdown text
    const text = parts.join("")

    return { text, citations }
  }

  async resetMemory() {
    const messages = await this.openai.beta.threads.messages.list(
      this.currentThread,
    )
    for (const message of messages.data) {
      this.openai.beta.threads.messages.del(this.currentThread, message.id)
    }
  }

  // rebuildMemory(messages: Message[]) {
  //   this.memory.chatHistory.clear()
  //   messages.forEach((message) => {
  //     switch (message.type) {
  //       case "USER_MESSAGE": {
  //         return this.memory.chatHistory.addUserMessage(
  //           message.content.newValue,
  //         )
  //       }
  //       case "BOT_MESSAGE": {
  //         return this.memory.chatHistory.addAIChatMessage(message._raw)
  //       }
  //     }
  //   })
  // }
}
