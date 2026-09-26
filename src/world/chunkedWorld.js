import { BlockType, isSolidBlock } from './blockTypes.js';
import { WORLD_HEIGHT, chunkBlockIndex, chunkCoordinate, chunkKey, chunkNeighborhood } from './chunkLayout.js';

export class ChunkedWorld {
  constructor(height = WORLD_HEIGHT) {
    this.height = height;
    this.chunks = new Map();
    this.blockListeners = [];
    this.loadListeners = [];
    this.unloadListeners = [];
    this.lastChunk = null;
  }

  loadChunk(chunk) {
    this.chunks.set(chunkKey(chunk.chunkX, chunk.chunkZ), chunk);
    this.lastChunk = null;
    this.loadListeners.forEach((listener) => listener(chunk.chunkX, chunk.chunkZ));
  }

  unloadChunk(chunkX, chunkZ) {
    const chunk = this.getChunk(chunkX, chunkZ);
    if (chunk === null) return null;
    this.chunks.delete(chunkKey(chunkX, chunkZ));
    this.lastChunk = null;
    this.unloadListeners.forEach((listener) => listener(chunkX, chunkZ, chunk));
    return chunk;
  }

  getChunk(chunkX, chunkZ) {
    return this.chunks.get(chunkKey(chunkX, chunkZ)) ?? null;
  }

  hasChunk(chunkX, chunkZ) {
    return this.chunks.has(chunkKey(chunkX, chunkZ));
  }

  hasNeighborhood(chunkX, chunkZ) {
    return chunkNeighborhood(chunkX, chunkZ).every((neighbor) => this.hasChunk(neighbor.chunkX, neighbor.chunkZ));
  }

  loadedChunks() {
    return [...this.chunks.values()];
  }

  contains(x, y, z) {
    if (y < 0 || y >= this.height) return false;
    return this.chunkAt(x, z) !== null;
  }

  getBlock(x, y, z) {
    if (y < 0 || y >= this.height) return BlockType.AIR;
    const chunk = this.chunkAt(x, z);
    if (chunk === null) return BlockType.AIR;
    return chunk.blocks[chunkBlockIndex(x - chunk.originX, y, z - chunk.originZ)];
  }

  setBlock(x, y, z, type) {
    const chunk = this.chunkAt(x, z);
    if (chunk === null || !chunk.setBlock(x, y, z, type)) return false;
    chunk.markDirty();
    this.blockListeners.forEach((listener) => listener(x, y, z, type));
    return true;
  }

  onBlockChanged(listener) {
    this.blockListeners.push(listener);
  }

  onChunkLoaded(listener) {
    this.loadListeners.push(listener);
  }

  onChunkUnloaded(listener) {
    this.unloadListeners.push(listener);
  }

  findSurfaceY(x, z) {
    for (let y = this.height - 1; y >= 0; y--) {
      if (isSolidBlock(this.getBlock(x, y, z))) return y;
    }
    return null;
  }

  chunkAt(x, z) {
    const chunkX = chunkCoordinate(x);
    const chunkZ = chunkCoordinate(z);
    const cached = this.lastChunk;
    if (cached !== null && cached.chunkX === chunkX && cached.chunkZ === chunkZ) return cached;
    const chunk = this.getChunk(chunkX, chunkZ);
    if (chunk !== null) this.lastChunk = chunk;
    return chunk;
  }
}
