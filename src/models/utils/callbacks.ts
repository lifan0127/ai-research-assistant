export interface ZoteroCallbacks {
  handleZoteroActionStart: (action: string) => void
  handleZoteroActionEnd: (action: string) => void
}
