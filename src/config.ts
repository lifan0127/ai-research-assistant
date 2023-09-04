import { BasicTool } from 'zotero-plugin-toolkit/dist/basic'
import Addon from './addon'
import { config } from '../package.json'
import { IS_ZOTERO_7 } from './constants'
import { fsPromises } from './polyfills/fs'
import './polyfills/object'
import './polyfills/array'
import './polyfills/string'
import './polyfills/error'
import './polyfills/promise'
import { crypto } from './polyfills/crypto'
import { setTimeout, clearTimeout } from './polyfills/timers'
import { ZoteroTextEncoder, ZoteroTextDecoder } from './polyfills/textencoder'

export default function globalConfig() {
  if (!IS_ZOTERO_7) {
    Components.utils.importGlobalProperties(['URL', 'URLSearchParams', 'fetch'])
  }

  // process.env = { ...process.env, LANGCHAIN_TRACING: __env__ === 'development' ? 'true' : 'false' }
  if (__env__ === 'development') {
    const tracing = Zotero.Prefs.get(`${config.addonRef}.LANGCHAIN_TRACING_V2`)
    if (tracing) {
      process.env = {
        ...process.env,
        LANGCHAIN_TRACING_V2: 'true',
        LANGCHAIN_ENDPOINT: Zotero.Prefs.get(`${config.addonRef}.LANGCHAIN_ENDPOINT`) as string,
        LANGCHAIN_API_KEY: Zotero.Prefs.get(`${config.addonRef}.LANGCHAIN_API_KEY`) as string,
        LANGCHAIN_PROJECT: Zotero.Prefs.get(`${config.addonRef}.LANGCHAIN_PROJECT`) as string,
      }
    }
  }

  const basicTool = new BasicTool()

  if (!basicTool.getGlobal('Zotero')[config.addonInstance]) {
    // Set global variables
    _globalThis.Zotero = basicTool.getGlobal('Zotero')
    _globalThis.ZoteroPane = basicTool.getGlobal('ZoteroPane')
    _globalThis.Zotero_Tabs = basicTool.getGlobal('Zotero_Tabs')
    _globalThis.window = basicTool.getGlobal('window')
    _globalThis.document = basicTool.getGlobal('document')
    _globalThis.setTimeout = setTimeout
    _globalThis.clearTimeout = clearTimeout
    _globalThis.fs = fsPromises
    _globalThis.crypto = crypto
    _globalThis.TextEncoder = ZoteroTextEncoder
    _globalThis.TextDecoder = ZoteroTextDecoder
    _globalThis.addon = new Addon()
    _globalThis.ztoolkit = addon.data.ztoolkit as any
    ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`
    ztoolkit.basicOptions.log.disableConsole = addon.data.env === 'production'
    ztoolkit.UI.basicOptions.ui.enableElementJSONLog = addon.data.env === 'development'
    ztoolkit.UI.basicOptions.ui.enableElementDOMLog = addon.data.env === 'development'
    ztoolkit.basicOptions.debug.disableDebugBridgePassword = addon.data.env === 'development'
    Zotero[config.addonInstance] = addon
    // Trigger addon hook for initialization
    addon.hooks.onStartup()
  }
}
