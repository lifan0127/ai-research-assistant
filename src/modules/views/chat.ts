import { BasicTool, BasicOptions } from 'zotero-plugin-toolkit/dist/basic'
import { ManagerTool } from 'zotero-plugin-toolkit/dist/basic'
import { UITool } from 'zotero-plugin-toolkit/dist/tools/ui'
import { ShortcutManager } from 'zotero-plugin-toolkit/dist/managers/shortcut'
import ToolkitGlobal from 'zotero-plugin-toolkit/dist/managers/toolkitGlobal'
import { marked } from 'marked'
import { serializeError } from 'serialize-error'
import { config, version } from '../../../package.json'
import { ExecutorWithMetadata, createQAExecutor } from '../../libs/agents'
import { AgentExecutor } from 'langchain/agents'
import { CallbackManager } from 'langchain/callbacks'
import { AgentAction } from 'langchain/dist/schema'
import { CopyIcon, CopySuccessIcon } from '../components/icons'

type Message = {
  role: 'user' | 'bot'
  message: string
}

export class Chat {
  private ui: UITool
  private base: BasicTool
  private document: Document
  private executor: AgentExecutor | undefined
  /**
   * Record the last text entered
   */
  private lastInputText = ''
  /**
   * Default text
   */
  private defaultText = {
    placeholder: 'How can I help you today?',
  }
  /**
   * It controls the max line number of commands displayed in `commandsNode`.
   */
  private maxLineNum: number = 12
  /**
   * The top-level HTML div node of `Chat`
   */
  private chatNode!: HTMLDivElement
  private loadingNode!: HTMLDivElement
  private conversationNode!: HTMLDivElement
  private OPENAI_API_KEY: string | undefined
  /**
   * The HTML input node of `Prompt`.
   */
  public inputNode!: HTMLInputElement
  /**
   * Save all commands registered by all addons.
   */
  public commands = []

  /**
   * Initialize `Prompt` but do not create UI.
   */
  constructor() {
    this.base = new BasicTool()
    this.ui = new UITool()
    this.document = this.base.getGlobal('document')
    this.OPENAI_API_KEY = Zotero.Prefs.get(`${config.addonRef}.OPENAI_API_KEY`) as string
    this.initializeUI()
    if (this.OPENAI_API_KEY !== '') {
      Zotero.HTTP.request('POST', 'https://api.openai.com/v1/chat/completions', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say this is a test!' }],
          temperature: 0.7,
        }),
      })
        .then(() => {
          const callbackManager = CallbackManager.fromHandlers({
            handleAgentAction: async (action: AgentAction) => {
              this.addActionOutput(action)
            },
          })
          createQAExecutor({ callbackManager }).then(this.initConversation.bind(this)).catch(console.error)
        })
        .catch((error: any) => {
          try {
            const message = JSON.parse(error.xmlhttp.response).error.message
            this.initError(message)
          } catch (error) {
            console.log({ unknownOpenAIApiError: error })
            this.initError('Unknown error. Please contact support.')
          }
        })
    } else {
      this.initConfiguration()
    }
  }

  private addActionOutput(action: AgentAction) {
    if (action.tool) {
      const actionNode = this.ui.createElement(this.document, 'div', {
        styles: {
          fontWeight: 'bold',
          padding: '0 12px 24px',
        },
        properties: {
          innerText: `🛠️ ${action.tool}`,
        },
        children: [
          {
            tag: 'span',
            styles: {
              fontWeight: 'normal',
              fontSize: '12px',
            },
            properties: {
              innerText:
                action.toolInput && typeof action.toolInput === 'string'
                  ? ` (input: ${
                      action.toolInput.length > 64
                        ? action.toolInput.slice(0, 64) + '...'
                        : action.toolInput || 'missing'
                    })`
                  : '',
            },
          },
        ],
      })
      this.conversationNode.appendChild(actionNode)
      this.conversationNode.scrollTo(0, this.conversationNode.scrollHeight)
    }

    // this.conversationNode
    console.log({ displayAction: action })
  }

  private initConfiguration() {
    const missingApiKeyNode = this.ui.createElement(this.document, 'div', {
      styles: {
        color: 'black',
        background: 'RGBA(255, 234, 0, 0.5)',
        padding: '24px',
        width: '75%',
        minWidth: '560px',
        textAlign: 'left',
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        border: '1px solid RGBA(215,200,50,1)',
        borderRadius: '18px',
      },
      children: [
        {
          tag: 'div',
          styles: {
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '18px',
          },
          properties: {
            innerText: 'OpenAI API key is required to use Aria.',
          },
        },
        {
          tag: 'div',
          styles: {
            fontSize: '14px',
          },
          properties: {
            innerHTML: `
              <ul>
                <li>Select <em>Edit</em> from the top menu bar, then select <em>Preferences</em> from the drop-down menu.</li>
                <li>On the top panel or the left-hand side panel, select <em>Aria</em>.</li>
                <li>Locate the <em>OpenAI API key</em> field and enter your API key in the text box.</li>
                <li>Click the "Close" button to save your change and <b>restart Zotero</b>.</li>
              </ul>
            `,
          },
        },
      ],
    })
    this.conversationNode.childNodes.forEach(child => child.remove())
    this.conversationNode.appendChild(missingApiKeyNode)
  }

  private initError(message: string) {
    const missingApiKeyNode = this.ui.createElement(this.document, 'div', {
      styles: {
        color: 'black',
        background: 'RGBA(255, 187, 129, 0.5)',
        padding: '24px',
        width: '75%',
        minWidth: '560px',
        textAlign: 'left',
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        border: '1px solid RGBA(255, 172, 120, 1)',
        borderRadius: '18px',
      },
      children: [
        {
          tag: 'div',
          styles: {
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '18px',
          },
          properties: {
            innerText: 'Error in connecting to OpenAI API.',
          },
        },
        {
          tag: 'div',
          styles: {
            fontSize: '14px',
          },
          properties: {
            innerText: message,
          },
        },
      ],
    })
    this.conversationNode.childNodes.forEach(child => child.remove())
    this.conversationNode.appendChild(missingApiKeyNode)
  }

  private initConversation({ executor, metadata: { title, description } }: ExecutorWithMetadata) {
    this.executor = executor
    const introductionNode = this.ui.createElement(this.document, 'div', {
      id: 'aria-chat-introduction',
      styles: {
        display: 'flex',
        flexDirection: 'row',
        color: '#666',
      },
      children: [
        {
          tag: 'div',
          styles: {
            width: '15%',
            marginRight: '24px',
          },
          children: [
            {
              tag: 'img',
              styles: {
                maxWidth: '100%',
              },
              properties: {
                src: `chrome://${config.addonRef}/content/icons/favicon@4x.png`,
                alt: 'Aria',
              },
            },
          ],
        },
        {
          tag: 'div',
          children: [
            {
              tag: 'h2',
              styles: {
                margin: '12px 0 0',
                padding: '0',
                fontSize: '28px',
              },
              properties: {
                innerText: 'A.R.I.A. (Aria)',
              },
            },
            {
              tag: 'div',
              styles: {
                margin: '0',
                padding: '0',
                fontSize: '14px',
              },
              properties: {
                innerText: 'Your AI Research Assistant',
              },
            },
            {
              tag: 'div',
              properties: {
                innerHTML: marked(description),
              },
            },
          ],
        },
      ],
    })
    this.conversationNode.childNodes.forEach(child => child.remove())
    this.conversationNode.appendChild(introductionNode)

    // // Add renaming notice
    // const noticeNode = this.ui.createElement(this.document, 'div', {
    //   id: 'aria-chat-notice',
    //   styles: {
    //     color: '#666',
    //     background: 'RGBA(255, 234, 0, 0.5)',
    //     padding: '12px',
    //     fontSize: '12px',
    //   },
    //   properties: {
    //     innerText:
    //       '📢 This plugin will be renamed in the coming days at the request of the Zotero project. Zotero is a registered trademark of the Corporation for Digital Scholarship.',
    //   },
    // })
    // this.conversationNode.appendChild(noticeNode)
  }

  /**
   * Initialize `Prompt` UI and then bind events on it.
   */
  public initializeUI() {
    this.addStyle()
    this.createHTML()
    this.initInputEvents()
    this.registerShortcut()
  }

  private createHTML() {
    const existingChatNode = this.document.getElementById('chat-node')
    existingChatNode?.remove()
    this.chatNode = this.ui.createElement(this.document, 'div', {
      id: 'chat-node',
      styles: {
        display: 'none',
      },
      children: [
        {
          tag: 'div',
          styles: {
            position: 'fixed',
            left: '0',
            top: '0',
            backgroundColor: 'rgba(220, 220, 220, 0.4)',
            width: '100%',
            height: '100%',
            opacity: '0.5',
          },
          listeners: [
            {
              type: 'click',
              listener: () => {
                this.chatNode.style.display = 'none'
              },
            },
          ],
        },
      ],
    })
    this.chatNode.appendChild(
      this.ui.createElement(this.document, 'div', {
        id: `aria-chat`,
        classList: ['chat-container'],
        children: [
          {
            tag: 'div',
            id: 'chat-conversation',
          },
          {
            tag: 'div',
            classList: ['chat-input'],
            children: [
              {
                id: 'input',
                tag: 'textarea',
                attributes: {
                  placeholder: this.defaultText.placeholder,
                },
              },
              {
                id: 'loading',
                tag: 'div',
                children: [
                  {
                    tag: 'div',
                    classList: ['dot-flashing'],
                  },
                ],
              },
            ],
          },
          {
            tag: 'div',
            classList: ['chat-instructions'],
            children: [
              {
                tag: 'div',
                classList: ['instruction'],
                children: [
                  {
                    tag: 'span',
                    properties: {
                      innerText: `${config.addonName} (${version})`,
                    },
                  },
                ],
              },
              {
                tag: 'div',
                classList: ['instruction'],
                children: [
                  {
                    tag: 'span',
                    properties: {
                      innerText: 'Model: GPT-Turbo-3.5',
                    },
                  },
                ],
              },
            ],
          },
        ],
      })
    )

    this.inputNode = this.chatNode.querySelector('#input')!
    this.conversationNode = this.chatNode.querySelector('#chat-conversation')!
    this.document.documentElement.appendChild(this.chatNode)
    this.loadingNode = this.chatNode.querySelector('#loading')!
    this.loadingNode.style.visibility = 'hidden'
  }

  /**
   * Show commands in a new `commandsContainer`
   * All other `commandsContainer` is hidden
   * @param commands Command[]
   * @param clear remove all `commandsContainer` if true
   */
  // public showCommands(commands: any[], clear: boolean = false) {
  //   if (clear) {
  //     this.chatNode.querySelectorAll('.message').forEach((e: any) => e.remove())
  //   }
  //   this.inputNode.placeholder = this.defaultText.placeholder
  //   const commandsContainer = this.createCommandsContainer()
  //   for (let command of commands) {
  //     if (command.when && !command.when()) {
  //       continue
  //     }
  //     commandsContainer.appendChild(this.createCommandNode(command))
  //   }
  // }

  /**
   * Create a `commandsContainer` div element, append to `commandsContainer` and hide others.
   * @returns commandsNode
   */
  public createCommandsContainer() {
    const commandsContainer = this.ui.createElement(this.document, 'div', {
      classList: ['message'],
    })
    // Add to container and hide others
    // this.chatNode.querySelectorAll('.message').forEach((e: any) => {
    //   e.style.display = 'none'
    // })
    this.chatNode.querySelector('.conversation')!.appendChild(commandsContainer)
    return commandsContainer
  }

  /**
   * Return current displayed `commandsContainer`
   * @returns
   */
  private getConversationContainer() {
    return [...this.chatNode.querySelectorAll('.message')].find((e: any) => {
      return e.style.display != 'none'
    }) as HTMLDivElement
  }

  private addUserInput(input: Message) {
    const message = input.message.replace(/\n/g, '<br/>')
    const inputNode = this.ui.createElement(this.document, 'div', {
      classList: ['chat-message', 'chat-message-user'],
      // properties: {
      //   innerHTML: input.message.replace(/\n/g, '<br/>'),
      // },
      children: [
        {
          tag: 'div',
          classList: ['hover-container'],
          children: [
            {
              tag: 'button',
              classList: ['copy-button'],
              styles: {
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              },
              listeners: [
                {
                  type: 'click',
                  listener: () => {
                    new ztoolkit.Clipboard().addText(message, 'text/unicode').copy()
                  },
                },
              ],
              children: [
                {
                  tag: 'div',
                  classList: ['copy-icon'],
                  properties: {
                    innerHTML: CopyIcon,
                  },
                },
              ],
            },
          ],
        },
        {
          tag: 'div',
          classList: ['markdown'],
          properties: {
            innerHTML: message,
          },
        },
      ],
    })
    this.conversationNode.appendChild(inputNode)
    this.conversationNode.scrollTo(0, this.conversationNode.scrollHeight)
  }

  private addBotOutput({ message }: Message) {
    if (message === 'Agent stopped due to max iterations.') {
      message = "Sorry. I can't answer this question because I've reached the maximum number of attempts."
    }
    const htmlMessage = marked(message)
    const outputNode = this.ui.createElement(this.document, 'div', {
      classList: ['chat-message', 'chat-message-bot'],
      children: [
        {
          tag: 'div',
          classList: ['hover-container'],
          children: [
            {
              tag: 'button',
              classList: ['copy-button'],
              styles: {
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              },
              listeners: [
                {
                  type: 'click',
                  listener: () => {
                    new ztoolkit.Clipboard().addText(message, 'text/unicode').addText(htmlMessage, 'text/html').copy()
                  },
                },
              ],
              children: [
                {
                  tag: 'div',
                  classList: ['copy-icon'],
                  properties: {
                    innerHTML: CopyIcon,
                  },
                },
              ],
            },
          ],
        },
        {
          tag: 'div',
          classList: ['markdown'],
          properties: {
            innerHTML: htmlMessage,
          },
        },
      ],
    })
    this.conversationNode.appendChild(outputNode)
    this.conversationNode.scrollTo(0, this.conversationNode.scrollHeight)
  }

  private setLoading(isLoading = false) {
    this.loadingNode.style.visibility = isLoading ? 'visible' : 'hidden'
  }

  /**
   * Create a command item for `Prompt` UI.
   * @param command
   * @returns
   */
  // public createCommandNode(command: any): HTMLElement {
  //   const commandNode = this.ui.createElement(this.document, 'div', {
  //     classList: ['command'],
  //     children: [
  //       {
  //         tag: 'div',
  //         classList: ['content'],
  //         children: [
  //           {
  //             tag: 'div',
  //             classList: ['name'],
  //             children: [
  //               {
  //                 tag: 'span',
  //                 properties: {
  //                   innerText: command.name,
  //                 },
  //               },
  //             ],
  //           },
  //           {
  //             tag: 'div',
  //             classList: ['aux'],
  //             children: command.label
  //               ? [
  //                   {
  //                     tag: 'span',
  //                     classList: ['label'],
  //                     properties: {
  //                       innerText: command.label,
  //                     },
  //                   },
  //                 ]
  //               : [],
  //           },
  //         ],
  //       },
  //     ],
  //     listeners: [
  //       {
  //         type: 'mousemove',
  //         listener: () => {
  //           this.selectItem(commandNode)
  //         },
  //       },
  //       {
  //         type: 'click',
  //         listener: async () => {
  //           if (Array.isArray(command.callback)) {
  //             this.showCommands(command.callback)
  //           } else {
  //             await command.callback(this)
  //           }
  //         },
  //       },
  //     ],
  //   })
  //   return commandNode
  // }

  /**
   * Called when `enter` key is pressed.
   */
  public async trigger(input: string) {
    if (input.trim() === '') {
      return
    }
    const userInput: Message = {
      role: 'user',
      message: input.trim(),
    }
    this.addUserInput(userInput)
    this.inputNode.value = ''
    this.inputNode.style.height = '20px'
    try {
      this.setLoading(true)
      const result = await this.executor!.call({ input })
      const botOutput: Message = {
        role: 'bot',
        message: result.output,
      }
      this.addBotOutput(botOutput)
      this.setLoading(false)
    } catch (error: any) {
      const errorObj = serializeError(error)
      console.log({ executorError: error, errorObj })
      if (errorObj.message && errorObj.message.startsWith('Unable to parse JSON response from chat agent.')) {
        const botOutput: Message = {
          role: 'bot',
          message: errorObj.message.replace('Unable to parse JSON response from chat agent.', '').trim(),
        }
        this.addBotOutput(botOutput)
      } else {
        const errorBotOutput: Message = {
          role: 'bot',
          message: `Sorry. An error occurred. Please try something else.
          <pre class='error'>${JSON.stringify(serializeError(error))}</pre>`,
        }
        this.addBotOutput(errorBotOutput)
      }
      this.setLoading(false)
    }
  }

  /**
   * Called when `escape` key is pressed.
   */
  public exit() {
    this.inputNode.placeholder = this.defaultText.placeholder
    if (this.chatNode.querySelectorAll('.conversation .message').length >= 2) {
      ;(this.chatNode.querySelector('.message:last-child') as HTMLDivElement).remove()
      const commandsContainer = this.chatNode.querySelector('.message:last-child') as HTMLDivElement
      commandsContainer.style.display = ''
      commandsContainer.querySelectorAll('.commands').forEach((e: any) => (e.style.display = 'flex'))
      this.inputNode.focus()
    } else {
      this.chatNode.style.display = 'none'
    }
  }

  /**
   * Bind events of pressing `keydown` and `keyup` key.
   */
  private initInputEvents() {
    // this.chatNode.addEventListener('keydown', event => {
    //   if (['ArrowUp', 'ArrowDown'].indexOf(event.key) != -1) {
    //     event.preventDefault()
    //     // get selected item and index
    //     let selectedIndex
    //     let allItems = [...this.getConversationContainer().querySelectorAll('.command')].filter(
    //       (e: any) => e.style.display != 'none'
    //     )
    //     selectedIndex = allItems.findIndex(e => e.classList.contains('selected'))
    //     if (selectedIndex != -1) {
    //       allItems[selectedIndex].classList.remove('selected')
    //       selectedIndex += event.key == 'ArrowUp' ? -1 : 1
    //     } else {
    //       if (event.key == 'ArrowUp') {
    //         selectedIndex = allItems.length - 1
    //       } else {
    //         selectedIndex = 0
    //       }
    //     }
    //     if (selectedIndex == -1) {
    //       selectedIndex = allItems.length - 1
    //     } else if (selectedIndex == allItems.length) {
    //       selectedIndex = 0
    //     }
    //     allItems[selectedIndex].classList.add('selected')
    //     let exceedNum = selectedIndex - this.maxLineNum + 2
    //     let commandsContainer = this.getConversationContainer()
    //     if (exceedNum > 0) {
    //       commandsContainer.scrollTo(
    //         0,
    //         (commandsContainer.querySelector('.selected') as HTMLElement).offsetTop -
    //           commandsContainer.offsetHeight -
    //           15
    //       )
    //     } else {
    //       commandsContainer.scrollTop = 0
    //     }
    //     allItems[selectedIndex].classList.add('selected')
    //   }
    // })

    // this.inputNode.addEventListener('keyup', event => {
    //   if (event.key == 'Enter' && !event.shiftKey) {
    //     return
    //   }
    //   this.inputNode.style.height = this.inputNode.scrollHeight + 'px'
    // })

    this.chatNode.addEventListener('keyup', async event => {
      if (event.key == 'Enter' && !event.shiftKey) {
        await this.trigger(this.inputNode.value)
      } else if (event.key == 'Escape') {
        if (this.inputNode.value.length > 0) {
          this.inputNode.value = ''
          return
        }
        this.exit()
      } else {
        this.inputNode.style.height = this.inputNode.scrollHeight + 'px'
      }
      if (this.inputNode.value == this.lastInputText) {
        return
      }

      // let commandsContainer = this.getConversationContainer()
      // let tipNode = commandsContainer.querySelector('.tip')
      // if (tipNode) {
      //   this.exit()
      //   commandsContainer = this.getConversationContainer()
      // }
      // commandsContainer.querySelectorAll('.command .name span').forEach((spanNode: any) => {
      //   spanNode.innerText = spanNode.innerText
      // })
      // if (this.inputNode.value.trim().length == 0) {
      //   ;[...commandsContainer.querySelectorAll('.command')].forEach((e: any) => {
      //     e.style.display = 'flex'
      //   })
      // }
      // this.lastInputText = this.inputNode.value

      // let inputText = this.inputNode.value.replace(/\s+/g, '')
      // let matchedArray: any[][] = []
      // commandsContainer.querySelectorAll('.command').forEach((commandNode: any) => {
      //   let spanNode = commandNode.querySelector('.name span') as HTMLElement
      //   let spanHTML = spanNode.innerText
      //   let matchedNum = 0
      //   let innerHTML = ''
      //   let tightness = 0
      //   let lasti = undefined
      //   for (let i = 0; i < spanHTML.length; i++) {
      //     if (inputText[matchedNum].toLowerCase() == spanHTML[i].toLowerCase()) {
      //       if (lasti == undefined) {
      //         lasti = i
      //       }
      //       tightness += i - lasti
      //       matchedNum++
      //       innerHTML += `<span class="highlight">${spanHTML[i]}</span>`
      //     } else {
      //       innerHTML += spanHTML[i]
      //     }
      //     if (matchedNum == inputText.length) {
      //       innerHTML += spanHTML.slice(i + 1)
      //       try {
      //         spanNode.innerHTML = innerHTML
      //       } catch {
      //         spanNode.innerHTML = spanHTML
      //       }
      //       matchedArray.push([tightness, commandNode, commandNode.innerText])
      //       break
      //     }
      //   }
      //   commandNode.style.display = 'none'
      //   commandNode.classList.remove('selected')
      // })
      // // select the first 3
      // matchedArray = matchedArray.sort((x, y) => y[0] - x[0]).slice(-3)
      // // compute rmse
      // let tightnessArray = matchedArray.map(e => e[0])
      // // mean
      // let s = 0
      // for (let i = 0; i < tightnessArray.length; i++) {
      //   s += tightnessArray[i]
      // }
      // let mean = s / tightnessArray.length
      // // variance
      // let v = 0
      // for (let i = 0; i < tightnessArray.length; i++) {
      //   v += (mean - tightnessArray[i]) ** 2
      // }
      // v = v / tightnessArray.length
      // if (v > 200) {
      //   matchedArray = matchedArray.slice(-1)
      // }
      // matchedArray.forEach(arr => (arr[1].style.display = 'flex'))
      // if (matchedArray.length > 0) {
      //   matchedArray[0][1].classList.add('selected')
      // } else {
      //   // this.showTip(this.defaultText.empty)
      // }
    })
  }

  /**
   * Create a commandsContainer and display a text
   */
  public showTip(text: string) {
    const tipNode = this.ui.createElement(this.document, 'div', {
      classList: ['tip'],
      properties: {
        innerText: text,
      },
    })
    this.createCommandsContainer().appendChild(tipNode)
    return tipNode
  }

  /**
   * Mark the selected item with class `selected`.
   * @param item HTMLDivElement
   */
  private selectItem(item: HTMLDivElement) {
    this.getConversationContainer()
      .querySelectorAll('.command')
      .forEach(e => e.classList.remove('selected'))
    item.classList.add('selected')
  }

  private addStyle() {
    const style = this.ui.createElement(this.document, 'style', {
      id: 'chat-style',
    })
    style.innerText = `
      .chat-container * {
        box-sizing: border-box;
      }
      .chat-container {
        overflow: hidden;
        padding: 9px 18px;
        position: fixed;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60%;
        top: 50%;
        height: 80%;
        min-width: 720px;
        border-radius: 10px;
        border: 1px solid #bdbdbd;
        justify-content: center;
        align-items: center;
        /* https://cssgradient.io/ */
        background: rgb(255,246,246);
        background: linear-gradient(170deg, rgba(255,246,246,1) 0%, rgba(230,240,255,1) 100%);
        font-size: 16px;
        box-shadow: 0px 1.8px 7.3px rgba(0, 0, 0, 0.071),
                    0px 6.3px 24.7px rgba(0, 0, 0, 0.112),
                    0px 30px 90px rgba(0, 0, 0, 0.2);
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Microsoft YaHei Light", sans-serif;
      }
      
      /* input */
      .chat-container .chat-input  {
        position: fixed;
        bottom: 30px;
        width: calc(100% - 36px);
        padding: 9px 12px;
        border-radius: 4px;
        border-width: 1px;
        border-color: rgba(0,0,0,0.1);
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        z-index: 100;
      }
      
      .chat-input textarea#input {
        width: 100%;
        height: 20px;
        max-height: 200px;
        padding: 0;
        background-color: transparent;
        resize: none;
        border-width: 0;
        font-size: 16px;
        overflow-y: auto;
        color: black;
      }

      .chat-input #loading {
        position: absolute;
        right: 24px;
        bottom: 15px;
      }

      .chat-input #loading .dot-flashing {
        position: relative;
        width: 10px;
        height: 10px;
        border-radius: 5px;
        background-color: #9880ff;
        color: #9880ff;
        animation: dot-flashing 1s infinite linear alternate;
        animation-delay: 0.5s;
      }
      .chat-input #loading .dot-flashing::before, 
      .chat-input #loading .dot-flashing::after {
        content: "";
        display: inline-block;
        position: absolute;
        top: 0;
      }
      .chat-input #loading .dot-flashing::before {
        left: -15px;
        width: 10px;
        height: 10px;
        border-radius: 5px;
        background-color: #9880ff;
        color: #9880ff;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 0s;
      }
      .chat-input #loading .dot-flashing::after {
        left: 15px;
        width: 10px;
        height: 10px;
        border-radius: 5px;
        background-color: #9880ff;
        color: #9880ff;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 1s;
      }

      @keyframes dot-flashing {
        0% {
          background-color: #9880ff;
        }
        50%, 100% {
          background-color: rgba(152, 128, 255, 0.2);
        }
      }
      
      /* results */
      #chat-conversation {
        width: 100%;
        height: calc(100% - 75px);
        mask-image: linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0)), linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0));
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;

        mask-image: linear-gradient(180deg, rgba(0,0,0,1), rgba(0,0,0,1) 98%, transparent)
      }
      #chat-conversation .chat-message {
        border-radius: 12px;
        margin-bottom: 18px;
        overflow-wrap: break-word;
        position: relative;
      }

      #chat-conversation .chat-message.chat-message-user {
        padding: 6px 12px;
        background: RGB(204, 41, 54, 1);
        color: white;
        width: auto;
        align-self: flex-end;
        max-width: 70%;
        border-width: 1px;
        box-shadow: 0 0 6px rgba(0,0,0,0.1);
      }

      #chat-conversation .chat-message.chat-message-bot {
        padding: 0 4px;
        background: RGBA(255, 255, 255, 1);
        width: auto;
        align-self: flex-start;
        max-width: 70%;
        border-color: RGBA(0, 0, 0, 0.5);
        border-width: 1px;
        border-color: rgba(0,0,0,0.1);
        box-shadow: 0 0 6px rgba(0,0,0,0.1);
        background: white;
        color: black;
      }

      #chat-conversation .chat-message.chat-message-bot .markdown * {
        margin: 8px;
      }

      #chat-conversation .chat-message.chat-message-bot .hover-container,
      #chat-conversation .chat-message.chat-message-user .hover-container  {
        visibility: hidden;
        position: absolute;
      }

      #chat-conversation .chat-message.chat-message-bot .hover-container {
        top: 9px;
        right: -30px;
      }

      #chat-conversation .chat-message.chat-message-user .hover-container {
        top: 8px;
        left: -30px;
      }

      #chat-conversation .chat-message.chat-message-bot:hover .hover-container,
      #chat-conversation .chat-message.chat-message-user:hover .hover-container  {
        visibility: visible;
      }

      

      #chat-conversation .chat-message.chat-message-bot .error {
        white-space: pre-wrap;
        background-color: #f3f3f3;
        color: #666;
        font-size: 12px;
      }

      #chat-conversation .chat-message.chat-message-bot .markdown {
        overflow: hidden;
      }

      #chat-conversation .chat-message.chat-message-bot .markdown table {
        width: 100%;
        table-layout: auto;
        text-align: left;
        margin-top: 2em;
        margin-bottom: 2em;
        font-size: 0.875em;
        line-height: 1.7142857;
      }

      #chat-conversation .chat-message.chat-message-bot .markdown thead {
        color: #1a202c;
        font-weight: 600;
        border-bottom: 1px solid RGB(0, 0, 0, 0.5);
      }

      #chat-conversation .chat-message.chat-message-bot .markdown thead th{
            vertical-align: bottom;
            padding-right: 0.5714286em;
            padding-bottom: 0.5714286em;
            padding-left: 0.5714286em;
      }

      .message {
        max-height: calc(${this.maxLineNum} * 35.5px);
        width: calc(100% - 12px);
        margin-left: 12px;
        margin-right: 0%;
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      .message .command {
        display: flex;
        align-content: baseline;
        justify-content: space-between;
        border-radius: 5px;
        padding: 6px 12px;
        margin-right: 12px;
        margin-top: 2px;
        margin-bottom: 2px;
      }
      .message .command .content {
        display: flex;
        width: 100%;
        justify-content: space-between;
        flex-direction: row;
        overflow: hidden;
      }
      .message .command .content .name {
        white-space: nowrap; 
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .message .command .content .aux {
        display: flex;
        align-items: center;
        align-self: center;
        flex-shrink: 0;
      }
      
      .message .command .content .aux .label {
        font-size: 15px;
        color: #5a5a5a;
        padding: 2px 6px;
        background-color: #fafafa;
        border-radius: 5px;
      }
      
      .message .selected {
          background-color: rgba(0, 0, 0, 0.075);
      }
      .message .highlight {
        font-weight: bold;
      }
      .tip {
        color: #5a5a5a;
        text-align: center;
        padding: 12px 12px;
        font-size: 18px;
      }
      
      .current-value {
        background-color: #a7b8c1;
        color: white;
        border-radius: 5px;
        padding: 0 5px;
        margin-left: 10px;
        font-size: 14px;
        vertical-align: middle;
        letter-spacing: 0.05em;
      }
      /* instructions */
      .chat-instructions {
        display: flex;
        align-content: center;
        justify-content: center;
        color: rgba(0, 0, 0, 0.4);
        height: 2em;
        width: 100%;
        margin-top: 5px;
        position: fixed;
        bottom: 0;
      }
      
      .chat-instructions .instruction {
        margin: auto .5em;  
        font-size: 12px;
      }
      
      .chat-instructions .key {
        margin-right: .2em;
        font-weight: 600;
      }
    `
    this.document.documentElement.appendChild(style)
  }

  private registerShortcut() {
    const shortCut = new ShortcutManager()
    shortCut.register('event', {
      id: 'aria-chat-key',
      modifiers: 'shift',
      key: 'r',
      callback: () => {
        if (this.chatNode.style.display == 'none') {
          this.chatNode.style.display = 'flex'
          this.inputNode.focus()
          // this.showCommands(this.commands, true)
        }
      },
    })
  }
}

export async function chat() {
  const dialogData: { [key: string | number]: any } = {
    inputValue: 'test',
    checkboxValue: true,
    loadCallback: () => {
      ztoolkit.log(dialogData, 'Dialog Opened!')
    },
    unloadCallback: () => {
      ztoolkit.log(dialogData, 'Dialog closed!')
    },
  }
  const dialogHelper = new ztoolkit.Dialog(10, 2)
    .addCell(0, 0, {
      tag: 'h1',
      properties: { innerHTML: 'Chat Window' },
    })
    .addCell(1, 0, {
      tag: 'h2',
      properties: { innerHTML: 'Conversational AI' },
    })
    .addCell(2, 0, {
      tag: 'p',
      properties: {
        innerHTML: "Elements with attribute 'data-bind' are binded to the prop under 'dialogData' with the same name.",
      },
      styles: {
        width: '200px',
      },
    })
    .addCell(3, 0, {
      tag: 'label',
      namespace: 'html',
      attributes: {
        for: 'dialog-checkbox',
      },
      properties: { innerHTML: 'bind:checkbox' },
    })
    .addCell(
      3,
      1,
      {
        tag: 'input',
        namespace: 'html',
        id: 'dialog-checkbox',
        attributes: {
          'data-bind': 'checkboxValue',
          'data-prop': 'checked',
          type: 'checkbox',
        },
        properties: { label: 'Cell 1,0' },
      },
      false
    )
    .addCell(4, 0, {
      tag: 'label',
      namespace: 'html',
      attributes: {
        for: 'dialog-input',
      },
      properties: { innerHTML: 'bind:input' },
    })
    .addCell(
      4,
      1,
      {
        tag: 'input',
        namespace: 'html',
        id: 'dialog-input',
        attributes: {
          'data-bind': 'inputValue',
          'data-prop': 'value',
          type: 'text',
        },
      },
      false
    )
    .addCell(5, 0, {
      tag: 'h2',
      properties: { innerHTML: 'Toolkit Helper Examples' },
    })
    .addCell(
      6,
      0,
      {
        tag: 'button',
        namespace: 'html',
        attributes: {
          type: 'button',
        },
        listeners: [
          {
            type: 'click',
            listener: (e: Event) => {
              addon.hooks.onDialogEvents('clipboardExample')
            },
          },
        ],
        children: [
          {
            tag: 'div',
            styles: {
              padding: '2.5px 15px',
            },
            properties: {
              innerHTML: 'example:clipboard',
            },
          },
        ],
      },
      false
    )
    .addCell(
      7,
      0,
      {
        tag: 'button',
        namespace: 'html',
        attributes: {
          type: 'button',
        },
        listeners: [
          {
            type: 'click',
            listener: (e: Event) => {
              addon.hooks.onDialogEvents('filePickerExample')
            },
          },
        ],
        children: [
          {
            tag: 'div',
            styles: {
              padding: '2.5px 15px',
            },
            properties: {
              innerHTML: 'example:filepicker',
            },
          },
        ],
      },
      false
    )
    .addCell(
      8,
      0,
      {
        tag: 'button',
        namespace: 'html',
        attributes: {
          type: 'button',
        },
        listeners: [
          {
            type: 'click',
            listener: (e: Event) => {
              addon.hooks.onDialogEvents('progressWindowExample')
            },
          },
        ],
        children: [
          {
            tag: 'div',
            styles: {
              padding: '2.5px 15px',
            },
            properties: {
              innerHTML: 'example:progressWindow',
            },
          },
        ],
      },
      false
    )
    .addCell(
      9,
      0,
      {
        tag: 'button',
        namespace: 'html',
        attributes: {
          type: 'button',
        },
        listeners: [
          {
            type: 'click',
            listener: (e: Event) => {
              addon.hooks.onDialogEvents('vtableExample')
            },
          },
        ],
        children: [
          {
            tag: 'div',
            styles: {
              padding: '2.5px 15px',
            },
            properties: {
              innerHTML: 'example:virtualized-table',
            },
          },
        ],
      },
      false
    )
    .addButton('Confirm', 'confirm')
    .addButton('Cancel', 'cancel')
    .addButton('Help', 'help', {
      noClose: true,
      callback: e => {
        dialogHelper.window?.alert('Help Clicked! Dialog will not be closed.')
      },
    })
    .setDialogData(dialogData)
    .open('Dialog Example')
  await dialogData.unloadLock.promise
  ztoolkit.getGlobal('alert')(
    `Close dialog with ${dialogData._lastButtonId}.\nCheckbox: ${dialogData.checkboxValue}\nInput: ${dialogData.inputValue}.`
  )
  ztoolkit.log(dialogData)
}

export class ChatManager extends ManagerTool {
  private chat: Chat
  /**
   * Save the commands registered from this manager
   */
  constructor(base?: BasicTool | BasicOptions) {
    super(base)
    this.chat = new Chat()
  }

  /**
   * Register commands. Don't forget to call `unregister` on plugin exit.
   * @param commands Command[]
   * @example
   * ```ts
   * let getReader = () => {
   *   return BasicTool.getZotero().Reader.getByTabID(
   *     (Zotero.getMainWindow().Zotero_Tabs).selectedID
   *   )
   * }
   *
   * register([
   *   {
   *     name: "Split Horizontally",
   *     label: "Zotero",
   *     when: () => getReader() as boolean,
   *     callback: (prompt: Prompt) => getReader().menuCmd("splitHorizontally")
   *   },
   *   {
   *     name: "Split Vertically",
   *     label: "Zotero",
   *     when: () => getReader() as boolean,
   *     callback: (prompt: Prompt) => getReader().menuCmd("splitVertically")
   *   }
   * ])
   * ```
   */
  public register(
    commands: {
      name: string
      label?: string
      when?: () => boolean
      callback: ((chat: Chat) => Promise<void>) | ((chat: Chat) => void) | any[]
    }[]
  ) {
    // this.chat.showCommands([], true)
  }

  /**
   * You can delete a command registed before by its name.
   * @remarks
   * There is a premise here that the names of all commands registered by a single plugin are not duplicated.
   * @param name Command.name
   */
  public unregister(name: string) {
    // // Delete it in this.prompt.commands
    // this.chat.commands = this.prompt.commands.filter(c => {
    //   JSON.stringify(this.commands.find(c => c.name == name)) != JSON.stringify(c)
    // })
    // // Delete it in this.commands
    // this.commands = this.commands.filter(c => c.name != name)
  }

  /**
   * Call `unregisterAll` on plugin exit.
   */
  public unregisterAll() {}
}
