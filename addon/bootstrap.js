/**
 * Most of this code is from Zotero team's official Make It Red example[1]
 * or the Zotero 7 documentation[2].
 * [1] https://github.com/zotero/make-it-red
 * [2] https://www.zotero.org/support/dev/zotero_7_for_developers
 */

var config = {
  addonID: "aria@apex974.com",
  addonRef: 'aria'
}

if (typeof Zotero == "undefined") {
  var Zotero
}

var chromeHandle

function install(data, reason) {}

// APP_STARTUP: 1,
// APP_SHUTDOWN: 2,
// ADDON_ENABLE: 3,
// ADDON_DISABLE: 4,
// ADDON_INSTALL: 5,
// ADDON_UNINSTALL: 6,
// ADDON_UPGRADE: 7,
// ADDON_DOWNGRADE: 8,

async function initDatabase() {
  // Create the database file in the Zotero profile directory
  const { FileUtils } = ChromeUtils.import("resource://gre/modules/FileUtils.jsm")
  const dbFile = FileUtils.getFile('ProfD', ['aria', 'db.sqlite'])
  // Open the SQLite database
  const storageService = Cc['@mozilla.org/storage/service;1'].getService(Ci.mozIStorageService)
  const dbConnection = storageService.openDatabase(dbFile)

  // Create the necessary tables (replace this SQL statement with your own)
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS DOCUMENTS(
      ITEM_ID TEXT,
      ITEM_TYPE TEXT,
      CHUNK_ID TEXT,
      TEXT TEXT,
      EMBEDDING BLOB
    );
  `
  // console.log({
  //   vector0: `${pluginPath}/chrome/content/libs/vector0`,
  //   vss0: `${pluginPath}/chrome/content/libs/vss0`
  // })

  try {
    // const vector0 = FileUtils.getFile(pluginPath, ['chrome', 'content', 'libs', 'vector0.so']).path
    // const vss0 = FileUtils.getFile(pluginPath, ['chrome', 'content', 'libs', 'vss0.so']).path
    // console.log({ vector0, vss0 })

    // Execute the SQL statement

    dbConnection.executeSimpleSQL(createTableSQL)
    Zotero.log({ dbSuccess: 'success' })
  } catch (e) {
    Zotero.log({ dbError: e })
  }

}

async function startup({ id, version, resourceURI, rootURI }, reason) {
  await Zotero.initializationPromise;

  // String 'rootURI' introduced in Zotero 7
  if (!rootURI) {
    rootURI = resourceURI.spec
  }

  var aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  var manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "__addonRef__", rootURI + "chrome/content/"],
  ]);

  // Initialize the plugin SQLite database
  switch (reason) {
    case ADDON_INSTALL:
    case APP_STARTUP: {
      // TODO: should only be done during plugin install
      // console.log('test wasm loader')
      // const { index, search } = await loadWasmModule()
      // console.log({ index, search })
      Zotero.log('initialize plugin database')
      initDatabase()
      break
    }
    case ADDON_UPGRADE: {
      // TODO: database migration as needed
      Zotero.log('perform plugin database migration')
      break
    }

  }

  const ctx = {
    rootURI,
  };
  ctx._globalThis = ctx;

  Services.scriptloader.loadSubScript(
    `${rootURI}/chrome/content/scripts/__addonRef__.js`,
    ctx,
  );
  Zotero.__addonInstance__.hooks.onStartup();
}

function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) {
    return
  }
  if (typeof Zotero === "undefined") {
    Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject
  }
  Zotero.__addonInstance__.hooks.onShutdown()

  Cc["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .flushBundles()

  Cu.unload(`${rootURI}/chrome/content/scripts/index.js`)

  if (chromeHandle) {
    chromeHandle.destruct()
    chromeHandle = null
  }
}

function uninstall(data, reason) { }

// Loads default preferences from defaults/preferences/prefs.js in Zotero 6
function setDefaultPrefs(rootURI) {
  var branch = Services.prefs.getDefaultBranch("")
  var obj = {
    pref(pref, value) {
      switch (typeof value) {
        case "boolean":
          branch.setBoolPref(pref, value)
          break
        case "string":
          branch.setStringPref(pref, value)
          break
        case "number":
          branch.setIntPref(pref, value)
          break
        default:
          Zotero.logError(`Invalid type '${typeof value}' for pref '${pref}'`)
      }
    },
  }
  Zotero.getMainWindow().console.log(rootURI + "prefs.js")
  Services.scriptloader.loadSubScript(rootURI + "prefs.js", obj)
}
