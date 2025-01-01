import { createSearchInstance, SearchParameters } from "../search"
import type { nsXPCComponents_Classes } from "../../../typings/global"
import { waitForWindow } from "../utils/utils"

interface AdvancedSearchWindow {
  ZoteroAdvancedSearch: {
    search: () => Promise<void>
    waitForLoad: () => Promise<void>
    itemsView: {
      waitForLoad: () => Promise<void>
    }
  }
}

export async function openAdvancedSearch(searchParams: SearchParameters) {
  // Open Advanced Search window
  // Based on https://github.com/zotero/zotero/blob/dc47650eb353a389dd01c20102ad5f4bbca7758b/chrome/content/zotero/zoteroPane.js#L1620
  const wm = (Components.classes as nsXPCComponents_Classes)[
    "@mozilla.org/appshell/window-mediator;1"
  ].getService(Components.interfaces.nsIWindowMediator)
  const enumerator = wm.getEnumerator("zotero:search")
  let win
  while (enumerator.hasMoreElements()) {
    win = enumerator.getNext()
  }

  if (win) {
    win.close()
  }

  const search = createSearchInstance(searchParams)

  const io = { dataIn: { search }, dataOut: null }
  Zotero.getMainWindow().openDialog(
    "chrome://zotero/content/advancedSearch.xhtml",
    "",
    "chrome,dialog=no,centerscreen",
    io,
  )

  // Wait for the advanced search window to load
  // Based on https://github.com/zotero/zotero/blob/dc47650eb353a389dd01c20102ad5f4bbca7758b/test/tests/advancedSearchTest.js#L27
  const searchWin = (await waitForWindow(
    "chrome://zotero/content/advancedSearch.xhtml",
    async (win) => {
      while (!win.ZoteroAdvancedSearch?.itemsView) {
        await Zotero.Promise.delay(5)
      }
    },
  )) as unknown as AdvancedSearchWindow

  const advancedSearch = searchWin.ZoteroAdvancedSearch
  await advancedSearch.search()
  await advancedSearch.waitForLoad()

  const itemsView = advancedSearch.itemsView
  await itemsView.waitForLoad()
}
