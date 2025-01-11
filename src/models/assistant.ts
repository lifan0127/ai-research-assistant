import { serializeError } from "serialize-error"
import OpenAI from "openai"
import { MessageCreateParams } from "openai/resources/beta/threads/messages"
import { Routes, createRouter, createRouteFunctions } from "./chains/router"
import { loadSearchChain } from "./chains/search"
import { loadRetrievalQAChain } from "./chains/qa"
import { ZoteroCallbacks, ErrorCallbacks } from "./utils/callbacks"
import { Message } from "../typings/legacyMessages"
import { simplifyStates, serializeStates, States } from "./utils/states"
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

export function log(...messages: any) {
  if (__env__ === "development") {
    ztoolkit.log("[aria/assistant]", ...messages)
  }
}

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

  streamMessage(content: string, states: States) {
    log("Streaming message")
    this.openai.beta.threads.messages.create(this.currentThread, {
      role: "user",
      content,
    })
    const stream = this.openai.beta.threads.runs.stream(this.currentThread, {
      assistant_id: this.assistants.routing,
      model: this.models.default,
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
      this.currentThread,
      this.currentRun as string,
      { tool_outputs: toolOutputs },
    )
    this.streams.push(stream)
    return stream
  }

  streamQA(question: string) {
    log("Streaming QA output")
    this.openai.beta.threads.messages.create(this.currentThread, {
      role: "user",
      content: question,
    })
    const stream = this.openai.beta.threads.runs.stream(this.currentThread, {
      assistant_id: this.assistants.file,
      model: this.models.default,
      additional_instructions: `Today is ${new Date().toDateString()}. You should ground the question in the provided context or through file_search in user's Zotero library.`,
    })
    this.streams.push(stream)
    return stream
  }

  async getFileMetadata(fileId: string) {
    const metadata = await this.openai.files.retrieve(fileId)
    return metadata
  }

  async uploadFile(
    item: Zotero.Item,
    attachment: Zotero.Item,
    purpose: FilePurpose,
  ) {
    const fileId = ztoolkit.ExtraField.getExtraField(item, "aria.file.id")
    if (fileId) {
      return fileId
    }
    const filePath = (await attachment.getFilePathAsync()) as string
    const fileContent = await IOUtils.read(filePath)
    const file = new File([fileContent], attachment.attachmentFilename, {
      type: attachment.attachmentContentType,
    })

    const response = await this.openai.files.create({ file, purpose })
    const newFileId = `${purpose}/${response.id}`
    ztoolkit.ExtraField.setExtraField(item, "aria.file.id", newFileId)
    return newFileId
  }

  async indexFile(item: Zotero.Item, fileId: string, vectorStoreId: string) {
    const vectorStoreIds = JSON.parse(
      ztoolkit.ExtraField.getExtraField(item, "aria.vectorStore.ids") || "[]",
    )
    if (vectorStoreIds.includes(vectorStoreId)) {
      return
    }
    const response = await this.openai.beta.vectorStores.files.createAndPoll(
      vectorStoreId,
      {
        file_id: fileId.split("/")[1],
      },
    )
    ztoolkit.ExtraField.setExtraField(
      item,
      "aria.vectorStore.ids",
      JSON.stringify([...vectorStoreIds, response.vector_store_id]),
    )
    return response
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
    const parts = []
    const citations = []

    // Filter and sort annotations by start_index
    const fileCitations = annotations
      .filter((annotation) => annotation.type === "file_citation")
      .sort((a, b) => a.start_index - b.start_index)

    for (const annotation of fileCitations) {
      const { start_index, end_index, file_citation } = annotation
      const beforeText = value.slice(lastIndex, start_index)
      const citationText = value.slice(start_index, end_index)
      const fileId = file_citation.file_id

      // Add preceding text
      if (beforeText) {
        parts.push(beforeText)
      }

      // Check if the fileId is already in the map
      let citationNumber
      if (citationMap.has(fileId)) {
        citationNumber = citationMap.get(fileId)
      } else {
        citationNumber = citationCounter++
        citationMap.set(fileId, citationNumber)

        // Fetch metadata
        const metadata = await this.getFileMetadata(fileId)
        citations.push({ number: citationNumber, ...metadata })
      }

      // Add citation reference
      parts.push(`${citationText} [${citationNumber}]`)

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

  rebuildMemory(messages: Message[]) {
    this.memory.chatHistory.clear()
    messages.forEach((message) => {
      switch (message.type) {
        case "USER_MESSAGE": {
          return this.memory.chatHistory.addUserMessage(
            message.content.newValue,
          )
        }
        case "BOT_MESSAGE": {
          return this.memory.chatHistory.addAIChatMessage(message._raw)
        }
      }
    })
  }
}
