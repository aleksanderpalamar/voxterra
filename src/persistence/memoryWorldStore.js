import { chunkKey } from '../world/chunkLayout.js';

export class MemoryWorldStore {
  constructor() {
    this.chunks = new Map();
    this.metadata = null;
  }

  hasChunk(chunkX, chunkZ) {
    return this.chunks.has(chunkKey(chunkX, chunkZ));
  }

  chunkCoordinates() {
    return [...this.chunks.values()].map(({ chunkX, chunkZ }) => ({ chunkX, chunkZ }));
  }

  async loadChunk(chunkX, chunkZ) {
    const entry = this.chunks.get(chunkKey(chunkX, chunkZ));
    return entry === undefined ? null : entry.blocks.slice();
  }

  async saveChunk(chunkX, chunkZ, blocks) {
    this.chunks.set(chunkKey(chunkX, chunkZ), { chunkX, chunkZ, blocks: blocks.slice() });
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
