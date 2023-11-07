import { Embeddings } from 'langchain/embeddings/base'
import { VectorStore } from 'langchain/vectorstores/base'
import { Document } from 'langchain/document'
import { InMemoryDocstore } from 'langchain/stores/doc/in_memory'
import init, { createIndex, runSearch, InitOutput } from './vector_search'
import { config } from '../../../package.json'

export class WasmVectorStore extends VectorStore {
  wasmModule?: InitOutput
  dimensions: number
  index?: any
  docstore: InMemoryDocstore
  _vectorstoreType(): string {
    return 'aria'
  }

  constructor(embeddings: Embeddings, _dbConfig: Record<string, any>) {
    super(embeddings, _dbConfig)
    this.dimensions = _dbConfig.dimensions
    this.docstore = _dbConfig?.docstore ?? new InMemoryDocstore()
  }

  async initWasmModule(): Promise<void> {
    this.wasmModule = await init(`chrome://${config.addonRef}/content/libs/vector_search_bg.wasm`)
  }

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    if (vectors.length === 0) {
      return
    }
    if (!this.wasmModule) {
      await this.initWasmModule()
    }
    const docstoreSize = (this.docstore as any).count
    const data = vectors.map((vector, i) => ({
      id: docstoreSize + i,
      embeddings: vector,
    }))
    this.index = createIndex(data)
    documents.forEach((doc, i) => this.docstore.add({ [docstoreSize + i]: doc }))
  }

  async addDocuments(documents: Document[]): Promise<void> {
    const texts = documents.map(({ pageContent }) => pageContent)
    return this.addVectors(await this.embeddings.embedDocuments(texts), documents)
  }

  async similaritySearchVectorWithScore(query: number[], k: number): Promise<[Document, number][]> {
    if (query.length !== this.dimensions) {
      throw new Error(`Query vector must have the same length as the number of dimensions (${this.dimensions})`)
    }
    const result: any[] = runSearch(this.index, query, k)
    console.log({ result, store: this.docstore })
    return Promise.all(
      result.map(
        async ({ id, distance }) => [await this.docstore.search(id.toString()), distance] as [Document, number]
      )
    )
  }

  static async fromDocuments(
    docs: Document[],
    embeddings: Embeddings,
    dbConfig: {
      dimensions: number
      docstore?: InMemoryDocstore
    }
  ): Promise<WasmVectorStore> {
    const instance = new this(embeddings, dbConfig)
    await instance.addDocuments(docs)
    return instance
  }
}
