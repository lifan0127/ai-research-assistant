export interface ZoteroCallbacks {
  handleZoteroActionStart: (action: string) => void
  handleZoteroActionEnd: (action: string) => void
}

export interface ErrorCallbacks {
  handleErrorEnd: (error: any) => void
}
