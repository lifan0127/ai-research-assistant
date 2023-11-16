import ZoteroToolkit from 'zotero-plugin-toolkit/dist/index'
import { ColumnOptions } from 'zotero-plugin-toolkit/dist/helpers/virtualizedTable'
import hooks from './hooks'
import { config } from '../package.json'
import { BasicTool, unregister } from 'zotero-plugin-toolkit/dist/basic'
import { UITool } from 'zotero-plugin-toolkit/dist/tools/ui'
import { PreferencePaneManager } from 'zotero-plugin-toolkit/dist/managers/preferencePane'
import { PromptManager } from 'zotero-plugin-toolkit/dist/managers/prompt'
import { ClipboardHelper } from 'zotero-plugin-toolkit/dist/helpers/clipboard'
import { ShortcutManager } from 'zotero-plugin-toolkit/dist/managers/shortcut'
import { ProgressWindowHelper } from 'zotero-plugin-toolkit/dist/helpers/progressWindow'
import { ReactRootManager } from './views/root'
import { Messages } from './modules/messages'

class Addon {
  public data: {
    alive: boolean
    // Env type, see build.js
    env: 'development' | 'production'
    ztoolkit: CustomToolkit
    // ztoolkit: ZoteroToolkit
    locale?: {
      stringBundle: any
    }
    prefs?: {
      window: Window
      columns: Array<ColumnOptions>
      rows: Array<{ [dataKey: string]: string }>
    }
    popup: {
      window: Window
      messages: Messages
    }
  }
  // Lifecycle hooks
  public hooks: typeof hooks
  // APIs
  public api: {}

  constructor() {
    const ztoolkit = new CustomToolkit()
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit,
      popup: {
        window,
        messages: new Messages(),
      },
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
  PreferencePane: PreferencePaneManager
  ReactRoot: ReactRootManager
  Prompt: PromptManager
  Shortcut: ShortcutManager
  Clipboard: typeof ClipboardHelper
  // LargePref: typeof LargePrefHelper
  ProgressWindow: typeof ProgressWindowHelper

  constructor() {
    super()
    this.UI = new UITool(this)
    this.PreferencePane = new PreferencePaneManager(this)
    this.Shortcut = new ShortcutManager(this)
    this.ReactRoot = new ReactRootManager(this)
    this.Prompt = new PromptManager(this)
    this.Clipboard = ClipboardHelper
    // this.LargePref = LargePrefHelper
    this.ProgressWindow = ProgressWindowHelper
    this.ProgressWindow.setIconURI('default', `chrome://${config.addonRef}/content/icons/favicon.png`)
  }

  unregisterAll() {
    unregister(this)
  }
}

export default Addon
