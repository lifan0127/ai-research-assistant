const { classes: Cc, interfaces: Ci, utils: Cu } = Components
Cu.import('resource://gre/modules/FileUtils.jsm')
Cu.import('resource://gre/modules/osfile.jsm')

export const fsPromises = {
  readFile: async function (filePath: any, options = { encoding: 'utf-8' }) {
    try {
      let fileData = await OS.File.read(filePath, options)
      return fileData
    } catch (error) {
      Zotero.debug('Error reading file: ' + error)
      throw error
    }
  },

  writeFile: async function (filePath: any, content: any, options = { encoding: 'utf-8' }) {
    try {
      await OS.File.writeAtomic(filePath, content, Object.assign(options, { tmpPath: filePath + '.tmp' }))
    } catch (error) {
      Zotero.debug('Error writing file: ' + error)
      throw error
    }
  },

  mkdir: async function (path: any, options: { recursive?: boolean; force?: boolean } = {}) {
    try {
      const file = Zotero.File.pathToFile(path)

      if (file.exists() && !options.force) {
        throw new Error(`Directory already exists: ${path}`)
      }

      if (options.recursive) {
        file.createUnique(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o755)
      } else {
        file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o755)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  statSync: function () {},

  createReadStream: function () {},

  ReadStream: class {
    constructor() {}

    on() {}

    read() {}
  },
}
