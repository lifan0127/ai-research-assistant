const MESSAGE_ID_LENGTH = 16

export function generateMessageId() {
  return Zotero.Utilities.randomString(MESSAGE_ID_LENGTH)
}
