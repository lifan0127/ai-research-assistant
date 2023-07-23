import { BufferWindowMemory } from 'langchain/memory'

export class ReadOnlyBufferWindowMemory extends BufferWindowMemory {
  async saveContext(): Promise<void> {
    return
  }
}
