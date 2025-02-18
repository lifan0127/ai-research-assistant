import { config } from "../../package.json"
import { getString, initLocale } from "../utils/locale"
// import { registerPrompt, registerShortcuts } from './modules/registry'
import { registerPrefs, registerPrefsScripts } from "./preferences"
// import { createZToolkit } from "./utils/ztoolkit";
import { CustomToolkit } from "./addon"

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ])
  initLocale()
  registerPrefs()

  ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`,
  )

  // TODO: Remove this after zotero#3387 is merged
  if (__env__ === "development") {
    // Keep in sync with the scripts/startup.mjs
    const loadDevToolWhen = `Plugin ${config.addonID} startup`
    ztoolkit.log(loadDevToolWhen)
  }

  await onMainWindowLoad(Zotero.getMainWindow())
}

async function onMainWindowLoad(win: Window): Promise<void> {
  // Create ztoolkit for every window
  // addon.data.ztoolkit = createZToolkit();
  addon.data.ztoolkit = new CustomToolkit()

  const popupWin = new ztoolkit.ProgressWindow(config.addonName, {
    closeOnClick: true,
    closeTime: -1,
  })
    .createLine({
      text: getString("startup-begin"),
      type: "default",
      progress: 0,
    })
    .show()

  await Zotero.Promise.delay(1000)
  popupWin.changeLine({
    progress: 30,
    text: `[30%] ${getString("startup-begin")}`,
  })

  await Zotero.Promise.delay(1000)

  popupWin.changeLine({
    progress: 100,
    text: `[100%] ${getString("startup-finish")}`,
  })
  popupWin.startCloseTimer(5000)

  addon.hooks.onDialogEvents("dialogExample")
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll()
  addon.data.popup?.window?.close()
}

function onShutdown(): void {
  ztoolkit.unregisterAll()
  addon.data.popup?.window?.close()
  // Remove addon object
  addon.data.alive = false
  delete Zotero[config.addonInstance]
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData)
  if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "reader"
  ) {
    // BasicExampleFactory.exampleNotifierCallback();
  } else {
    return
  }
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window)
      break
    default:
      return
  }
}

function onShortcuts(type: string) {
  switch (type) {
    // case 'larger':
    //   KeyExampleFactory.exampleShortcutLargerCallback()
    //   break
    // case 'smaller':
    //   KeyExampleFactory.exampleShortcutSmallerCallback()
    //   break
    // case 'confliction':
    //   KeyExampleFactory.exampleShortcutConflictingCallback()
    //   break
    default:
      break
  }
}

function onDialogEvents(type: string) {
  switch (type) {
    // case 'dialogExample':
    //   chat()
    //   break
    // case 'clipboardExample':
    //   HelperExampleFactory.clipboardExample()
    //   break
    // case 'filePickerExample':
    //   HelperExampleFactory.filePickerExample()
    //   break
    // case 'progressWindowExample':
    //   HelperExampleFactory.progressWindowExample()
    //   break
    // case 'vtableExample':
    //   HelperExampleFactory.vtableExample()
    //   break
    default:
      break
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
}
