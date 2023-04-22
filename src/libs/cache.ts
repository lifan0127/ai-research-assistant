// import { BaseCache } from 'langchain/dist/cache'

export class SQLiteCache {
  db: any
  constructor() {
    const { FileUtils } = Components.utils.import('resource://gre/modules/FileUtils.jsm')
    const dbFile = FileUtils.getFile('ProfD', ['aria', 'db.sqlite'])
    // Open the SQLite database
    const storageService = Components.classes['@mozilla.org/storage/service;1'].getService(
      Components.interfaces.mozIStorageService
    )
    this.db = storageService.openDatabase(dbFile)
    this.initDatabase()
  }

  async initDatabase() {
    this.db.executeSimpleSQL(
      `
      CREATE TABLE IF NOT EXISTS LANGCHAIN_CACHE (
        prompt TEXT,
        llm TEXT,
        idx INTEGER,
        response TEXT,
        PRIMARY KEY (prompt, llm, idx)
      )
    `.trim()
    )
  }

  async lookup(prompt: string, llmKey: string) {
    console.log('lookup', prompt, llmKey)
    const rows = await this.db.queryAsync(
      `SELECT response FROM LANGCHAIN_CACHE WHERE prompt = ? AND llm = ? ORDER BY idx`,
      [prompt, llmKey]
    )

    if (rows.length > 0) {
      const generations = rows.map((row: any) => ({ text: row.response }))
      return generations
    }

    return null
  }

  async update(prompt: string, llmKey: string, value: { text: string }[]) {
    for (let i = 0; i < value.length; i++) {
      await this.db.queryAsync(`INSERT OR REPLACE INTO cache (prompt, llm, idx, response) VALUES (?, ?, ?, ?)`, [
        prompt,
        llmKey,
        i,
        value[i].text,
      ])
    }
  }
}
