// import ZoteroToolkit from 'zotero-plugin-toolkit/dist/index'
// import { ColumnOptions } from 'zotero-plugin-toolkit/dist/helpers/virtualizedTable'
import hooks from "./hooks"
import { config } from "../../package.json"
import {
  BasicTool,
  unregister,
  UITool,
  PromptManager,
  ClipboardHelper,
  KeyboardManager,
  ProgressWindowHelper,
  ExtraFieldTool,
  MessageHelper,
} from "zotero-plugin-toolkit"
import { ReactRootManager } from "../views/root"
import { MessageStore, FileMessageStore } from "../utils/messageStore"
import { handlers } from "../workers/dbWorkers"

export class Addon {
  public data: {
    alive: boolean
    // Env type, see build.js
    env: "development" | "production"
    ztoolkit: CustomToolkit
    // ztoolkit: ZoteroToolkit
    locale?: {
      current: any
    }
    prefs?: {
      window: Window
    }
    popup: {
      window: Window
      messageStore: MessageStore
    }
    db: {
      worker?: Worker,
      server?: MessageHelper<typeof handlers>
    }
  }
  // Lifecycle hooks
  public hooks: typeof hooks
  // APIs
  public api: object

  constructor() {
    const ztoolkit = new CustomToolkit()
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit,
      popup: {
        window: Zotero.getMainWindow(),
        messageStore: new FileMessageStore(),
      },
      db: {},
    }
    this.hooks = hooks
    this.api = {}
  }
}

/**
 * Alternatively, import toolkit modules you use to minify the plugin size.
 *
 * Steps to replace the default `ztoolkit: ZoteroToolkit` with your `ztoolkit: MyToolkit`:
 *
 * 1. Uncomment this file's line 30:            `ztoolkit: new MyToolkit(),`
 *    and comment line 31:                      `ztoolkit: new ZoteroToolkit(),`.
 * 2. Uncomment this file's line 10:            `ztoolkit: MyToolkit;` in this file
 *    and comment line 11:                      `ztoolkit: ZoteroToolkit;`.
 * 3. Uncomment `./typing/global.d.ts` line 12: `declare const ztoolkit: import("../src/addon").MyToolkit;`
 *    and comment line 13:                      `declare const ztoolkit: import("zotero-plugin-toolkit").ZoteroToolkit;`.
 *
 * You can now add the modules under the `MyToolkit` class.
 */

export class CustomToolkit extends BasicTool {
  UI: UITool
  ReactRoot: ReactRootManager
  Prompt: PromptManager
  Keyboard: KeyboardManager
  Clipboard: typeof ClipboardHelper
  // LargePref: typeof LargePrefHelper
  ProgressWindow: typeof ProgressWindowHelper
  ExtraField: ExtraFieldTool

  constructor() {
    super()
    this.UI = new UITool(this)
    this.Keyboard = new KeyboardManager(this)
    this.ReactRoot = new ReactRootManager(this)
    this.Prompt = new PromptManager(this)
    this.Clipboard = ClipboardHelper
    // this.LargePref = LargePrefHelper
    this.ProgressWindow = ProgressWindowHelper
    this.ProgressWindow.setIconURI(
      "default",
      `chrome://${config.addonRef}/content/icons/favicon.png`,
    )
    this.ExtraField = new ExtraFieldTool(this)
  }

  unregisterAll() {
    unregister(this)
  }
}
