import { BasicTool, BasicOptions } from 'zotero-plugin-toolkit/dist/basic'
import { ManagerTool } from 'zotero-plugin-toolkit/dist/basic'
import { UITool } from 'zotero-plugin-toolkit/dist/tools/ui'
import { ShortcutManager } from 'zotero-plugin-toolkit/dist/managers/shortcut'
import { Providers } from './Providers'
import { config } from '../../package.json'
import React from 'react'
import ReactDOM from 'react-dom'

export class ReactRoot {
  private ui: UITool
  private base: BasicTool
  private document: Document
  private root!: HTMLDivElement
  private activeElement?: HTMLElement
  private dialog?: Window

  constructor() {
    this.base = new BasicTool()
    this.ui = new UITool()
    this.document = this.base.getGlobal('document')
    this.registerStyle()
    this.registerShortcut()
  }

  private registerStyle() {
    const styles = this.ui.createElement(document, 'link', {
      properties: {
        type: 'text/css',
        rel: 'stylesheet',
        href: `chrome://${config.addonRef}/content/scripts/index.css`,
      },
    })
    this.document.documentElement.appendChild(styles)
  }

  private launchApp() {
    // const existingRoot = this.document.getElementById('aria-react-root')
    // existingRoot?.remove()
    // this.root = this.ui.createElement(this.document, 'div', {
    //   id: 'aria-react-root',
    //   styles: {
    //     position: 'fixed',
    //     left: '0',
    //     top: '0',
    //     width: '0',
    //     height: '0',
    //   },
    //   // listeners: [
    //   //   {
    //   //     type: 'click',
    //   //     listener: event => {
    //   //       if (event.target === event.currentTarget) {
    //   //         this.root.style.visibility = 'hidden'
    //   //         this.unfocus()
    //   //       }
    //   //     },
    //   //   },
    //   // ],
    // })
    // this.document.documentElement.appendChild(this.root)
    // this.document.addEventListener('keyup', (event: KeyboardEvent) => {
    //   if (event.key === 'Escape') {
    //     setVisibility('hidden')
    //     this.unfocus()
    //   }
    // })
    // ReactDOM.render(React.createElement(Container), this.root)
    const windowArgs = {
      _initPromise: Zotero.Promise.defer(),
    }
    const dialogWidth = Math.max(window.outerWidth * 0.6, 720)
    const dialogHeight = window.outerHeight * 0.8
    const left = window.screenX + window.outerWidth / 2 - dialogWidth / 2
    const top = window.screenY + window.outerHeight / 2 - dialogHeight / 2
    const dialog = (window as any).openDialog(
      'chrome://aria/content/popup.xul',
      `${config.addonRef}-aria`,
      `chrome,titlebar,status,width=${dialogWidth},height=${dialogHeight},left=${left},top=${top}`,
      windowArgs
    )
    // Assign the dialog to the addon object so that it can be accessed from within the addon
    addon.data.popup.window = dialog
    // await windowArgs._initPromise.promise
    this.dialog = dialog
    const this2 = this
    dialog!.addEventListener(
      'load',
      function () {
        const entry = dialog.document.getElementById('aria-entry-point')
        ReactDOM.render(React.createElement(Providers), entry)
      },
      { once: true }
    )
    dialog.addEventListener(
      'dialogclosing',
      function () {
        this2.dialog = undefined
      },
      { once: true }
    )
  }

  private registerShortcut() {
    // Keycodes: https://github.com/windingwind/zotero-plugin-toolkit/blob/da8a602b81a7586b51a29baff86d22d0422b6580/src/managers/shortcut.ts#L746
    const shortCut = new ShortcutManager()
    shortCut.register('event', {
      id: 'aria-plugin-key',
      modifiers: (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_MODIFIER`) as string) || 'shift',
      key: (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_KEY`) as string) || 'r',
      callback: event => {
        if (this.dialog) {
          this.dialog.focus()
        } else {
          this.launchApp()
        }
      },
    })
  }
}

export class ReactRootManager extends ManagerTool {
  private reactRoot: ReactRoot

  constructor(base?: BasicTool | BasicOptions) {
    super(base)
    this.reactRoot = new ReactRoot()
  }

  public register(
    commands: {
      name: string
      label?: string
      when?: () => boolean
      callback: ((reactRoot: ReactRoot) => Promise<void>) | ((reactRoot: ReactRoot) => void) | any[]
    }[]
  ) {}

  public unregister(name: string) {}

  public unregisterAll() {}
}
