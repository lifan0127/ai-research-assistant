import Dexie, { Table } from "dexie"
import { FileObject } from "openai/resources"
import { MessageStore, MessageContent } from "../typings/messages"

export type ConversationDBSchema = Omit<MessageStore, "messages" | "pendingUpdate" | "pendingDelete">

export type MessageDBSchema = Omit<MessageContent, "stream">

export type FileDBSchema = {
  id: string
  vectorStoreIds: string[]
  itemId: number
  itemType: string
  attachmentId: number
  attachmentType: string
  bib: string
  timestamp: string
}

class Database extends Dexie {
  public conversations!: Table<ConversationDBSchema, string>
  public messages!: Table<MessageDBSchema, string>
  public files!: Table<FileDBSchema, string>

  constructor() {
    super("aria-database")

    this.version(1).stores({
      conversations: "id",
      // The first field is the primary key. Additional fields are indexes.
      messages: "id, conversationId, timestamp",
      files: "id, vectorStoreIds, timestamp",
    })

  }
}

// Create a single DB instance
export const db = new Database()
