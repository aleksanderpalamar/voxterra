import { BlockType } from './blockTypes.js';
import { CHUNK_SIZE, chunkBlockIndex, chunkVolume } from './chunkLayout.js';

export class Chunk {
  constructor(chunkX, chunkZ, height, blocks = new Uint8Array(chunkVolume(height))) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.height = height;
    this.blocks = blocks;
    this.originX = chunkX * CHUNK_SIZE;
    this.originZ = chunkZ * CHUNK_SIZE;
  }

  contains(x, y, z) {
    const localX = x - this.originX;
    const localZ = z - this.originZ;
    return localX >= 0 && localX < CHUNK_SIZE
      && localZ >= 0 && localZ < CHUNK_SIZE
      && y >= 0 && y < this.height;
  }

  getBlock(x, y, z) {
    if (!this.contains(x, y, z)) return BlockType.AIR;
    return this.blocks[this.indexOf(x, y, z)];
  }

  setBlock(x, y, z, type) {
    if (!this.contains(x, y, z)) return false;
    const index = this.indexOf(x, y, z);
    if (this.blocks[index] === type) return false;
    this.blocks[index] = type;
    return true;
  }

  indexOf(x, y, z) {
    return chunkBlockIndex(x - this.originX, y, z - this.originZ);
  }
}
