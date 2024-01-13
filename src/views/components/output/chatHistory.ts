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
  const chatHistoryHtml = (
    await Promise.all(
      await messages.map(async message => {
        switch (message.type) {
          case 'USER_MESSAGE': {
            const { content, states } = message
            if (!states) {
              return `
              <div>
              <h3>User:</h3>
              ${marked(content.newPlainTextValue)}
              </div>
            `.trim()
            }
            const items =
              states.items && states.items.length
                ? '<h4>Items</h4><ul>' + states.items.map(item => `<li>${item.title}</li>`).join('\n') + '</ul>'
                : ''
            const collections =
              states.collections && states.collections.length
                ? '<h4>Collections</h4><ul>' +
                  states.collections.map(col => `<li>${col.title}</li>`).join('\n') +
                  '</ul>'
                : ''
            const creators =
              states.creators && states.collections.length
                ? '<h4>Creators</h4><ul>' +
                  states.creators.map(creator => `<li>${creator.title}</li>`).join('\n') +
                  '</ul>'
                : ''
            const tags =
              states.tags && states.tags.length
                ? '<h4>Tags</h4><ul>' + states.tags.map(tag => `<li>${tag}</li>`).join('\n') + '</ul>'
                : ''
            const images =
              states.images && states.images.length
                ? '<h4>Images</h4><ul>' +
                  states.images
                    .map(img => `<li>${img.id}<img src="${img.image}" title="${img.title}"/></li>`)
                    .join('\n') +
                  '</ul>'
                : ''
            return `
          <div>
          <h3>User:</h3>
          ${marked(content.newPlainTextValue)}
          ${items}
          ${collections}
          ${creators}
          ${tags}
          ${images}
          </div>
          `
          }
          case 'BOT_MESSAGE': {
            const { widget, input } = message
            switch (widget) {
              case 'MARKDOWN': {
                const { htmlContent } = Markdown.compileContent(input as Markdown.Props)
                return '<div><h3>' + config.addonName + ':</h3> ' + htmlContent + '</div>'
              }
              case 'SEARCH_RESULTS': {
                const { htmlContent } = await SearchResults.compileContent(input as SearchResults.Props)
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
    )
  ).join('\n')
  const note = new Zotero.Item('note')
  note.setNote(
    '<div data-schema-version="8">' +
      `<h1>New Chat History from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
      chatHistoryHtml +
      '</div>'
  )
  const ariaCollection = await createCollection(ARIA_LIBRARY)
  note.addToCollection(ariaCollection.id)
  await note.saveTx()
  ZoteroPane.selectItem(note.id, true)
}
