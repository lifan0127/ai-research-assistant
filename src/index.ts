import { BasicTool } from 'zotero-plugin-toolkit/dist/basic'
import Addon from './addon'
import { config } from '../package.json'
import { IS_ZOTERO_7 } from './constants'
import { fsPromises } from './polyfills/fs'
import './polyfills/object'
import './polyfills/string'
import './polyfills/error'
import { crypto } from './polyfills/crypto'
import { setTimeout, clearTimeout } from './polyfills/timers'
import { ZoteroTextEncoder, ZoteroTextDecoder } from './polyfills/textencoder'

if (!IS_ZOTERO_7) {
  Components.utils.importGlobalProperties(['URL', 'URLSearchParams', 'fetch'])
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
