// Function to wait for a window to load
export async function waitForWindow(
  uri: string,
  callback: (win: Window) => void,
) {
  const deferred = Zotero.Promise.defer()
  const loadObserver = (event: any) => {
    const target = event.target
    target.removeEventListener("load", loadObserver, false)
    if (target.location.href !== uri) {
      return
    }

    Services.ww.unregisterNotification(windowObserver)
    const win = target.ownerGlobal

    win.setTimeout(async () => {
      if (callback) {
        try {
          await callback(win)
          deferred.resolve(win)
        } catch (e) {
          Zotero.logError(event)
          win.close()
          deferred.reject(event)
        }
      } else {
        deferred.resolve(win)
      }
    })
  }

  const windowObserver = {
    observe: (subject: any, topic: string) => {
      if (topic !== "domwindowopened") return
      subject.addEventListener("load", loadObserver, false)
    },
  }

  Services.ww.registerNotification(windowObserver)
  return deferred.promise
}
