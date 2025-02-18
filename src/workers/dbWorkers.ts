import { MessageHelper } from "zotero-plugin-toolkit"
import { db, ConversationDBSchema, MessageDBSchema, FileDBSchema } from "../db/db"

// "handlers" define all the methods for message management in the database.
export const handlers = {
  /**
   * Create or update a conversation.
   * If you want to *only* create if new, you can do `.add()` and handle conflicts,
   * but `.put()` replaces or inserts.
   */
  async upsertConversation(conversation: ConversationDBSchema) {
    await db.conversations.put(conversation)
  },

  /** Get a conversation by ID. */
  async getConversation(id: string) {
    const result = await db.conversations.get(id)
    return result
  },

  /** Remove a conversation. */
  async deleteConversation(id: string) {
    await db.conversations.delete(id)
  },

  /** Add or update a message. Use .put() so it overwrites if the same id exists. */
  async upsertMessage(message: MessageDBSchema) {
    await db.messages.put(message)
  },

  /** Add or update multiple messages. Use .bulkPut() to handle multiple messages at once. */
  async upsertMessages(messages: MessageDBSchema[]) {
    await db.messages.bulkPut(messages)
  },

  /** Get all messages in a conversation, sorted by timestamp. */
  async getMessages(conversationId: string) {
    const results = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp")
    return results
  },

  /** Delete a single message by ID. */
  async deleteMessage(id: string) {
    await db.messages.delete(id)
  },

  /** Delete multiple messages by their IDs. */
  async deleteMessages(ids: string[]) {
    await db.messages.bulkDelete(ids)
  },

  /** Clear all messages from the database. */
  async clearAllMessages() {
    await db.messages.clear()
  },

  /** 
   * Clear an entire conversation’s messages, 
   * but leave the conversation metadata if desired.
   */
  async clearMessagesForConversation(conversationId: string) {
    await db.messages
      .where("conversationId")
      .equals(conversationId)
      .delete()
  },

  /* Upsert file metadata */
  async upsertFile(file: FileDBSchema) {
    await db.files.put(file)
  },

  /* Get file metadata */
  async getFile(fileId: string) {
    const result = await db.files.get(fileId)
    return result
  },

  /* Delete file metadata */
  async deleteFile(fileId: string) {
    await db.files.delete(fileId)
  },

  /* Remove expired file metadata older than a threashold */
  async purgeFiles(maxAge: number) {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() - maxAge)
    await db.files
      .where("timestamp")
      .below(expirationDate.toISOString())
      .delete()
  },

  /* Delete all file metadata */
  async clearAllFiles() {
    await db.files.clear()
  },
}



const messageServer = new MessageHelper({
  canBeDestroyed: true,
  dev: true,
  name: "dbWorker",
  target: self,
  handlers,
})
messageServer.start()

