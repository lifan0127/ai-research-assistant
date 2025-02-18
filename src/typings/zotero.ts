export type ItemMode = 'search' | 'preview' | 'qa' | 'citation'

export interface ItemInfo {
  id: number
  url: string
  type: string
  title?: string
  creators?: string
  year?: number
  abstract?: string
}

export interface AttachmentInfo {
  id: number
  type:
  | 'attachment-pdf'
  | 'attachment-pdf-link'
  | 'attachment-file'
  | 'attachment-link'
  | 'attachment-snapshot'
  | 'attachment-web-link'
}
