function createLogger(category: string) {
  return function (...messages: any) {
    if (__env__ === "development") {
      ztoolkit.log(`[aria/${category}]`, ...messages)
    }
  }
}

export const action = createLogger("action")
export const assistant = createLogger("assistant")
export const db = createLogger("db")
export const file = createLogger("file")
export const menu = createLogger("menu")
export const message = createLogger("message")
export const states = createLogger("states")
export const step = createLogger("step")
export const store = createLogger("store")
export const tool = createLogger("tool")
export const workflow = createLogger("workflow")
export const zotero = createLogger("zotero")