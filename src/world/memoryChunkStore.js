import { chunkKey } from './chunkLayout.js';

export class MemoryChunkStore {
  constructor() {
    this.entries = new Map();
  }

  load(chunkX, chunkZ) {
    return this.entries.get(chunkKey(chunkX, chunkZ)) ?? null;
  }

  save(chunkX, chunkZ, blocks) {
    this.entries.set(chunkKey(chunkX, chunkZ), blocks);
  }
}
