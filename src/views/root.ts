import { BasicTool, BasicOptions, ManagerTool, UITool, KeyboardManager } from 'zotero-plugin-toolkit'
import { Providers } from './Providers'
import { config } from '../../package.json'
import React from 'react'
import { createRoot } from 'react-dom/client'

export class ReactRoot {
  private ui: UITool
  private base: BasicTool
  private document: Document
  private root!: HTMLDivElement
  private activeElement?: HTMLElement
  private dialog?: Window

  constructor(Keyboard: KeyboardManager) {
    this.base = new BasicTool()
    this.ui = new UITool()
    this.document = this.base.getGlobal('document')
    // this.registerStyle()
    this.registerToolbar()
    this.registerShortcut(Keyboard)
    // As message entries are no longer stored in preferences (due to the size limit), we need to remove the existing entries. This may be removed after several upgrade cycles.
    this.removeMessagesInPrefs()
  }

  // private registerStyle() {
  //   const styles = this.ui.createElement(document, 'link', {
  //     properties: {
  //       type: 'text/css',
  //       rel: 'stylesheet',
  //       href: `chrome://${config.addonRef}/content/scripts/${config.addonRef}.css`,
  //     },
  //   })
  //   this.document.documentElement.appendChild(styles)
  // }

  private registerToolbar() {
    const ariaBtn = this.ui.createElement(this.document, 'toolbarbutton', {
      id: 'zotero-tb-aria',
      removeIfExists: true,
      attributes: {
        class: 'zotero-tb-button',
        tooltiptext: 'Launch Aria',
        style: 'list-style-image: url(chrome://aria/content/icons/favicon@16x16.png)',
      },
      listeners: [
        {
          type: 'click',
          listener: () => {
            if (this.dialog && !this.dialog.closed) {
              this.dialog.focus()
            } else {
              this.launchApp()
            }
          },
        },
      ],
    })
    const toolbarNode = this.document.getElementById('zotero-tb-note-add')
    if (toolbarNode) {
      toolbarNode.after(ariaBtn)
    }
  }

  private removeMessagesInPrefs() {
    try {
      const rootKey = 'extensions.zotero.aria.messageKeys'
      const rootVal = Zotero.Prefs.get(rootKey, true)
      if (typeof rootVal !== 'string') {
        return
      }
      const messageKeys = JSON.parse(rootVal) || []
      messageKeys.forEach((key: string) => Zotero.Prefs.clear('aria.message.' + key, true))
      Zotero.Prefs.clear(rootKey, true)
      console.log('Aria messages in prefs removed.')
    } catch (error) {
      console.log('Error removing Aria messages in prefs', error)
    }
  }

  private launchApp() {
    const windowArgs = {
      _initPromise: Zotero.Promise.defer(),
    }
    const window = Zotero.getMainWindow()
    const dialogWidth = Math.max(window.outerWidth * 0.6, 720)
    const dialogHeight = window.outerHeight * 0.8
    const left = window.screenX + window.outerWidth / 2 - dialogWidth / 2
    const top = window.screenY + window.outerHeight / 2 - dialogHeight / 2

    const dialog = (window as any).openDialog(
      'chrome://aria/content/popup.xhtml',
      `${config.addonRef}-window`,
      `chrome,titlebar,status,width=${dialogWidth},height=${dialogHeight},left=${left},top=${top},resizable=yes`,
      windowArgs
    )
    // setTimeout(() => {
    //   // Setting width and height in openDialog doesn't work in Zotero 7 with http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul
    //   dialog.resizeTo(dialogWidth, dialogHeight)
    // }, 100)
    // Assign the dialog to the addon object so that it can be accessed from within the addon
    addon.data.popup.window = dialog
    // await windowArgs._initPromise.promise
    this.dialog = dialog
    // const this2 = this
    dialog!.addEventListener(
      'load',
      () => {
        const entry = dialog.document.getElementById('aria-entry-point')
        const root = createRoot(entry)
        root.render(React.createElement(Providers))
      },
      { once: true }
    )
    dialog.addEventListener(
      'dialogclosing',
      () => {
        this.dialog = undefined
      },
      { once: true }
    )
  }

  private registerShortcut(Keyboard: KeyboardManager) {
    // Keycodes: https://github.com/windingwind/zotero-plugin-toolkit/blob/da8a602b81a7586b51a29baff86d22d0422b6580/src/managers/shortcut.ts#L746
    const modifiers = (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_MODIFIER`) as string) || 'shift'
    const key = (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_KEY`) as string) || 'r'
    Keyboard.register((ev, data) => {
      if (data.type === "keyup" && data.keyboard) {
        if (data.keyboard.equals(`${modifiers},${key}`)) {
          if (this.dialog && !this.dialog.closed) {
            this.dialog.focus()
          } else {
            this.launchApp()
          }
        }

      }
    })
    // ztoolkit.Keyboard.register('event', {
    //   id: 'aria-plugin-key',
    //   modifiers: (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_MODIFIER`) as string) || 'shift',
    //   key: (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_KEY`) as string) || 'r',
    //   callback: event => {
    //     if (this.dialog && !this.dialog.closed) {
    //       this.dialog.focus()
    //     } else {
    //       this.launchApp()
    //     }
    //   },
    // })
  }
}

type BasicToolWithKeyboardManager = BasicTool & { Keyboard: KeyboardManager }

export class ReactRootManager extends ManagerTool {
  private reactRoot: ReactRoot

  constructor(base: BasicToolWithKeyboardManager) {
    super(base)
    this.reactRoot = new ReactRoot(base.Keyboard)
  }

  public register(
    commands: {
      name: string
      label?: string
      when?: () => boolean
      callback: ((reactRoot: ReactRoot) => Promise<void>) | ((reactRoot: ReactRoot) => void) | any[]
    }[]
  ) { }

  public unregister(name: string) { }

  public unregisterAll() { }
}
