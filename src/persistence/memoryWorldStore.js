import { chunkKey } from '../world/chunkLayout.js';

export class MemoryWorldStore {
  constructor() {
    this.chunks = new Map();
    this.metadata = null;
  }

  hasChunk(chunkX, chunkZ) {
    return this.chunks.has(chunkKey(chunkX, chunkZ));
  }

  async loadChunk(chunkX, chunkZ) {
    const blocks = this.chunks.get(chunkKey(chunkX, chunkZ));
    return blocks === undefined ? null : blocks.slice();
  }

  async saveChunk(chunkX, chunkZ, blocks) {
    this.chunks.set(chunkKey(chunkX, chunkZ), blocks.slice());
  }

  async loadMetadata() {
    return this.metadata === null ? null : structuredClone(this.metadata);
  }

  async saveMetadata(metadata) {
    this.metadata = structuredClone(metadata);
  }

  async clear() {
    this.chunks.clear();
    this.metadata = null;
  }
}
