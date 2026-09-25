import { BlockType, isSolidBlock } from './blockTypes.js';

export class World {
  constructor(sizeX, sizeY, sizeZ) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.blocks = new Uint8Array(sizeX * sizeY * sizeZ);
    this.listeners = [];
  }

  contains(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sizeX && y < this.sizeY && z < this.sizeZ;
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
    this.listeners.forEach((listener) => listener(x, y, z, type));
    return true;
  }

  onBlockChanged(listener) {
    this.listeners.push(listener);
  }

  findSurfaceY(x, z) {
    for (let y = this.sizeY - 1; y >= 0; y--) {
      if (isSolidBlock(this.getBlock(x, y, z))) return y;
    }
    return null;
  }

  indexOf(x, y, z) {
    return x + this.sizeX * (z + this.sizeZ * y);
  }
}
