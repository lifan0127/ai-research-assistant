export interface Control {
  scrollToEnd: () => void
  pauseScroll: () => void
  resumeScroll: () => void
  addFunctionCallOutput: (tool_call_id: string, output: string) => void
}
