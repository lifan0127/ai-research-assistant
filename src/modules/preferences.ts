import { config } from '../../package.json'
import { getString } from './locale'

export function registerPrefsWindow() {
  const prefOptions = {
    pluginID: config.addonID,
    src: rootURI + 'chrome/content/preferences.xhtml',
    label: getString('prefs.title'),
    image: `chrome://${config.addonRef}/content/icons/favicon@0.333x.png`,
    extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
    defaultXUL: true,
  }
  ztoolkit.PreferencePane.register(prefOptions)
}

export function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [
        {
          dataKey: 'title',
          label: 'prefs.table.title',
          fixedWidth: true,
          width: 100,
        },
        {
          dataKey: 'detail',
          label: 'prefs.table.detail',
        },
      ],
      rows: [
        {
          title: 'Orange',
          detail: "It's juicy",
        },
        {
          title: 'Banana',
          detail: "It's sweet",
        },
        {
          title: 'Apple',
          detail: 'I mean the fruit APPLE',
        },
      ],
    }
  } else {
    addon.data.prefs.window = _window
  }
  updatePrefsUI()
  bindPrefEvents()
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal('Zotero').Promise.defer()
  // const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window!)
  //   .setContainerId(`${config.addonRef}-table-container`)
  //   .setProp({
  //     id: `${config.addonRef}-prefs-table`,
  //     // Do not use setLocale, as it modifies the Zotero.Intl.strings
  //     // Set locales directly to columns
  //     columns: addon.data.prefs?.columns.map(column =>
  //       Object.assign(column, {
  //         label: getString(column.label) || column.label,
  //       })
  //     ),
  //     showHeader: true,
  //     multiSelect: true,
  //     staticColumns: true,
  //     disableFontSizeScaling: true,
  //   })
  //   .setProp('getRowCount', () => addon.data.prefs?.rows.length || 0)
  //   .setProp(
  //     'getRowData',
  //     index =>
  //       addon.data.prefs?.rows[index] || {
  //         title: 'no data',
  //         detail: 'no data',
  //       }
  //   )
  //   // Show a progress window when selection changes
  //   .setProp('onSelectionChange', selection => {
  //     new ztoolkit.ProgressWindow(config.addonName)
  //       .createLine({
  //         text: `Selected line: ${addon.data.prefs?.rows
  //           .filter((v, i) => selection.isSelected(i))
  //           .map(row => row.title)
  //           .join(',')}`,
  //         progress: 100,
  //       })
  //       .show()
  //   })
  //   // When pressing delete, delete selected line and refresh table.
  //   // Returning false to prevent default event.
  //   .setProp('onKeyDown', (event: KeyboardEvent) => {
  //     if (event.key == 'Delete' || (Zotero.isMac && event.key == 'Backspace')) {
  //       addon.data.prefs!.rows =
  //         addon.data.prefs?.rows.filter((v, i) => !tableHelper.treeInstance.selection.isSelected(i)) || []
  //       tableHelper.render()
  //       return false
  //     }
  //     return true
  //   })
  //   // For find-as-you-type
  //   .setProp('getRowString', index => addon.data.prefs?.rows[index].title || '')
  //   // Render the table.
  //   .render(-1, () => {
  //     renderLock.resolve()
  //   })
  await renderLock.promise
  ztoolkit.log('Preference table rendered!')
}

function bindPrefEvents() {
  // addon.data
  //   .prefs!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-enable`)
  //   ?.addEventListener('command', e => {
  //     ztoolkit.log(e)
  //     addon.data.prefs!.window.alert(`Successfully changed to ${(e.target as XUL.Checkbox).checked}!`)
  //   })
  // addon.data
  //   .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-input`)
  //   ?.addEventListener('change', e => {
  //     ztoolkit.log(e)
  //     addon.data.prefs!.window.alert(`Successfully changed to ${(e.target as HTMLInputElement).value}!`)
  //   })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-OPENAI_MODEL-0`)
    ?.addEventListener('command', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new OPENAI Model to take effect.`)
    })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-OPENAI_MODEL-1`)
    ?.addEventListener('command', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new OPENAI Model to take effect.`)
    })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-OPENAI_BASE_URL`)
    ?.addEventListener('change', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new OPENAI Base URL to take effect.`)
    })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-SHORTCUT_MODIFIER-shift`)
    ?.addEventListener('command', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new shortcut combo to take effect.`)
    })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-SHORTCUT_MODIFIER-ctrl-shift`)
    ?.addEventListener('command', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new shortcut combo to take effect.`)
    })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-SHORTCUT_MODIFIER-alt-shift`)
    ?.addEventListener('command', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new shortcut combo to take effect.`)
    })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-SHORTCUT_KEY`)
    ?.addEventListener('change', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new shortcut combo to take effect.`)
    })
  // addon.data
  //   .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-OPENAI_MODEL-2`)
  //   ?.addEventListener('command', e => {
  //     addon.data.prefs!.window.alert(`Please restart Zotero for your new OPENAI Model to take effect.`)
  //   })
  addon.data
    .prefs!!.window.document.querySelector(`#zotero-prefpane-${config.addonRef}-OPENAI_API_KEY`)
    ?.addEventListener('change', e => {
      addon.data.prefs!.window.alert(`Please restart Zotero for your new OPENAI API Key to take effect.`)
    })
}
