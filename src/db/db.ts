import Dexie, { Table } from "dexie"
import { MessageStore, MessageInput } from "../typings/messages"

export type ConversationDBSchema = Omit<MessageStore, "messages" | "pendingUpdate" | "pendingDelete">

export type MessageDBSchema = Omit<MessageInput, "stream">

class Database extends Dexie {
  public conversations!: Table<ConversationDBSchema, string>
  public messages!: Table<MessageDBSchema, string>

  constructor() {
    super("aria-database")

    this.version(1).stores({
      conversations: "id",
      // The first field is the primary key. Additional fields are indexes.
      messages: "id, conversationId, timestamp",
    })
  }
}

// Create a single DB instance
export const db = new Database()
