import { MessageHelper } from "zotero-plugin-toolkit"
import type { handlers } from "../workers/dbWorkers"
import { config } from "../../package.json"
import { generateTimestamp } from "../utils/datetime"
import { MessageStore, MessageInput } from "../typings/messages"

function log(...messages: any) {
  ztoolkit.log("[aria/db client]", ...messages)
}

function closeDBServer() {
  if (addon.data.db.server) {
    addon.data.db.server.destroy()
    addon.data.db.server = undefined
  }
}

async function getDBServer(): Promise<MessageHelper<typeof handlers>> {
  if (!addon.data.db.server) {
    const worker = new Worker(
      `chrome://${config.addonRef}/content/scripts/dbWorkers.js`,
      { name: "dbWorker" },
    )
    const server = new MessageHelper<typeof handlers>({
      canBeDestroyed: false,
      dev: __env__ === "development",
      name: "dbWorkerMain",
      target: worker,
      handlers: {},
    })
    server.start()
    await server.exec("_ping")
    addon.data.db.server = server
  }

  return addon.data.db.server!
}

export { getDBServer, closeDBServer }

export async function getConversation(conversationId: string) {
  const server = await getDBServer()
  const conversation = await server.proxy.getConversation(conversationId)
  log("Get conversation", conversationId, conversation)
  return conversation
}

export async function upsertConversation(conversation: Omit<MessageStore, "messages" | "pendingUpdate" | "pendingDelete">) {
  const server = await getDBServer()
  await server.proxy.upsertConversation(conversation)
  log("Upsert conversation", conversation)
}

export async function upsertMessage(message: Omit<MessageInput, "stream">) {
  const server = await getDBServer()
  await server.proxy.upsertMessage(message)
  log("Upsert message", message)
}

export async function upsertMessages(messages: Omit<MessageInput, "stream">[]) {
  const server = await getDBServer()
  await server.proxy.upsertMessages(messages)
  log(`Upsert ${messages.length} message(s)`, messages)
}

export async function deleteMessages(messageIds: string[]) {
  const server = await getDBServer()
  await server.proxy.deleteMessages(messageIds)
  log(`Delete ${messageIds.length} message(s)`, messageIds)
}

export async function getAllMessages(conversationId: string) {
  const server = await getDBServer()
  const messages = await server.proxy.getMessages(conversationId)
  log(`Get ${messages.length} message(s)`, messages)
  return messages
}

export async function clearAllMessages() {
  const server = await getDBServer()
  log("Clear all messages")
  return server.proxy.clearAllMessages()
}
