import { BasicTool } from 'zotero-plugin-toolkit/dist/basic'
import { config } from '../package.json'
// import { fsPromises } from './polyfills/fs'
import './polyfills/object'
import './polyfills/array'
import './polyfills/string'
import './polyfills/error'
import './polyfills/promise'
import { crypto } from './polyfills/crypto'
import { setTimeout, clearTimeout } from './polyfills/timers'
import { ZoteroTextEncoder, ZoteroTextDecoder } from './polyfills/textencoder'

export default function globalConfig() {

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

  function defineGlobal(name: Parameters<BasicTool["getGlobal"]>[0]): void;
  function defineGlobal(name: string, getter: () => any): void;
  function defineGlobal(name: string, getter?: () => any) {
    Object.defineProperty(_globalThis, name, {
      get() {
        return getter ? getter() : basicTool.getGlobal(name);
      },
    });
  }

  if (!basicTool.getGlobal('Zotero')[config.addonInstance]) {
    // Set global variables
    // _globalThis.Zotero = basicTool.getGlobal('Zotero')
    // _globalThis.console = basicTool.getGlobal('Zotero').getMainWindow().console
    // _globalThis.console = basicTool.getGlobal('window').console
    // _globalThis.ZoteroPane = basicTool.getGlobal('ZoteroPane')
    // _globalThis.Zotero_Tabs = basicTool.getGlobal('Zotero_Tabs')
    // _globalThis.window = basicTool.getGlobal('window')
    // _globalThis.document = basicTool.getGlobal('document')
    // _globalThis.setTimeout = setTimeout
    // _globalThis.clearTimeout = clearTimeout
    // // _globalThis.fs = fsPromises
    // _globalThis.crypto = crypto
    // _globalThis.TextEncoder = ZoteroTextEncoder
    // _globalThis.TextDecoder = ZoteroTextDecoder
    // _globalThis.addon = new Addon()
    // _globalThis.ztoolkit = addon.data.ztoolkit as any
    // ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`
    // ztoolkit.basicOptions.log.disableConsole = addon.data.env === 'production'
    // ztoolkit.UI.basicOptions.ui.enableElementJSONLog = addon.data.env === 'development'
    // ztoolkit.UI.basicOptions.ui.enableElementDOMLog = addon.data.env === 'development'
    // ztoolkit.basicOptions.debug.disableDebugBridgePassword = addon.data.env === 'development'
    // Zotero[config.addonInstance] = addon
    // // Trigger addon hook for initialization
    // addon.hooks.onStartup()

    defineGlobal("console", () => {
      const window = basicTool.getGlobal('Zotero').getMainWindow() as any
      return window.console
    });
    defineGlobal("window");
    defineGlobal("document");
    defineGlobal("ZoteroPane");
    defineGlobal("Zotero_Tabs");

    const Addon = require('./addon').default
    _globalThis.addon = new Addon();
    defineGlobal("ztoolkit", () => {
      return _globalThis.addon.data.ztoolkit;
    });
    Zotero[config.addonInstance] = addon;
  }
}