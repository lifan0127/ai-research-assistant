import { marked } from 'marked'
import * as Markdown from '../widgets/Markdown'
import * as SearchResults from '../widgets/SearchResults'
import * as QAResponse from '../widgets/QAResponse'
import * as Error from '../widgets/Error'
import { Message } from '../message/types'
import { config } from '../../../../package.json'
import { createCollection } from '../../../apis/zotero/collection'
import { ARIA_LIBRARY } from '../../../constants'

export async function chatHistoryToNote(messages: Message[]) {
  const chatHistoryHtml = messages
    .map(message => {
      switch (message.type) {
        case 'USER_MESSAGE': {
          const { content } = message
          return '<div><h3>User:</h3> ' + marked(content.newPlainTextValue) + '</div>'
        }
        case 'BOT_MESSAGE': {
          const { widget, input } = message
          switch (widget) {
            case 'MARKDOWN': {
              const { htmlContent } = Markdown.compileContent(input as Markdown.Props)
              return '<div><h3>' + config.addonName + ':</h3> ' + htmlContent + '</div>'
            }
            case 'SEARCH_RESULTS': {
              const { htmlContent } = SearchResults.compileContent(input as SearchResults.Props)
              return '<div><h3>' + config.addonName + ':</h3> ' + htmlContent + '</div>'
            }
            case 'QA_RESPONSE': {
              const { htmlContent } = QAResponse.compileContent(input as QAResponse.Props)
              return '<div><h3>' + config.addonName + ':</h3> ' + htmlContent + '</div>'
            }
            case 'ERROR': {
              const { htmlContent } = Error.compileContent(input as Error.Props)
              return '<div><h3>' + config.addonName + ':</h3> ' + htmlContent + '</div>'
            }
            default: {
              const textContent = '<pre>' + JSON.stringify(input, null, 2) + '</pre>'
              const htmlContent = marked(textContent)
              return `<div><h3>${config.addonName}:</h3> ` + htmlContent + '</div>'
            }
          }
        }
        case 'BOT_INTERMEDIATE_STEP': {
          const {
            input: { content },
          } = message
          return `<div><h3>${config.addonName}:</h3> ` + marked(content) + '</div>'
        }
      }
    })
    .join('\n')
  const item = new Zotero.Item('note')
  item.setNote(
    '<div data-schema-version="8">' +
      `<h1>New Chat History from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
      chatHistoryHtml +
      '</div>'
  )
  const ariaCollection = await createCollection(ARIA_LIBRARY)
  item.addToCollection(ariaCollection.id)
  await item.saveTx()
}
