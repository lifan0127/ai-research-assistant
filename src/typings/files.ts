export type FileForIndexing = {
  item: Zotero.Item
  attachment: Zotero.Item | undefined
  file: string | undefined
  index: string | undefined
}

export type FilePreparationStatus = "STANDBY" | "IN_PROGRESS" | "COMPLETED" | "FAILED"