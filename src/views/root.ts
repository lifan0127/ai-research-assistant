import { BasicTool, BasicOptions } from 'zotero-plugin-toolkit/dist/basic'
import { ManagerTool } from 'zotero-plugin-toolkit/dist/basic'
import { UITool } from 'zotero-plugin-toolkit/dist/tools/ui'
import { ShortcutManager } from 'zotero-plugin-toolkit/dist/managers/shortcut'
import Container from './Container'
import { config } from '../../package.json'
import React from 'react'
import ReactDOM from 'react-dom'

export class ReactRoot {
  private ui: UITool
  private base: BasicTool
  private document: Document
  private root!: HTMLDivElement
  private activeElement?: HTMLElement

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
    const existingRoot = this.document.getElementById('aria-react-root')
    existingRoot?.remove()
    this.root = this.ui.createElement(this.document, 'div', {
      id: 'aria-react-root',
      styles: {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
      },
      listeners: [
        {
          type: 'click',
          listener: event => {
            if (event.target === event.currentTarget) {
              this.root.style.visibility = 'hidden'
              this.unfocus()
            }
          },
        },
      ],
    })
    this.document.documentElement.appendChild(this.root)
    this.document.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.root.style.visibility = 'hidden'
        this.unfocus()
      }
    })
    ReactDOM.render(React.createElement(Container), this.root)
  }

  private registerShortcut() {
    const shortCut = new ShortcutManager()
    shortCut.register('event', {
      id: 'aria-plugin-key',
      modifiers: 'shift',
      key: 'r',
      callback: event => {
        if (!this.root) {
          this.launchApp()
        } else {
          this.root.style.visibility = 'visible'
        }
        this.focus()
      },
    })
  }

  private focus() {
    this.activeElement = this.document.activeElement as HTMLElement
    const chatInputNode = this.root.querySelector('#aria-chat-input') as HTMLInputElement
    chatInputNode?.focus()
  }

  private unfocus() {
    this.activeElement?.focus()
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
