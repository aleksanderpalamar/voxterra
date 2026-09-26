import { BlockType } from './blockTypes.js';
import { CHUNK_SIZE, chunkBlockIndex, chunkNeighborhood } from './chunkLayout.js';

export const PADDED_SIZE = CHUNK_SIZE + 2;

function paddedIndex(paddedX, y, paddedZ) {
  return paddedX + PADDED_SIZE * (paddedZ + PADDED_SIZE * y);
}

function axisSpan(offset) {
  if (offset < 0) return { start: CHUNK_SIZE - 1, end: CHUNK_SIZE, target: 0 };
  if (offset > 0) return { start: 0, end: 1, target: CHUNK_SIZE + 1 };
  return { start: 0, end: CHUNK_SIZE, target: 1 };
}

function copyNeighbor(volume, blocks, spanX, spanZ, height) {
  for (let y = 0; y < height; y++) {
    for (let z = spanZ.start; z < spanZ.end; z++) {
      const paddedZ = spanZ.target + z - spanZ.start;
      for (let x = spanX.start; x < spanX.end; x++) {
        volume[paddedIndex(spanX.target + x - spanX.start, y, paddedZ)] = blocks[chunkBlockIndex(x, y, z)];
      }
    }
  }
}

export function extractPaddedVolume(getChunk, chunkX, chunkZ, height) {
  const volume = new Uint8Array(PADDED_SIZE * PADDED_SIZE * height);
  chunkNeighborhood(chunkX, chunkZ).forEach((neighbor) => {
    const chunk = getChunk(neighbor.chunkX, neighbor.chunkZ);
    if (chunk === null) return;
    copyNeighbor(volume, chunk.blocks, axisSpan(neighbor.chunkX - chunkX), axisSpan(neighbor.chunkZ - chunkZ), height);
  });
  return volume;
}

export class PaddedVolume {
  constructor(volume, chunkX, chunkZ, height) {
    this.volume = volume;
    this.height = height;
    this.originX = chunkX * CHUNK_SIZE - 1;
    this.originZ = chunkZ * CHUNK_SIZE - 1;
  }

  getBlock(x, y, z) {
    const paddedX = x - this.originX;
    const paddedZ = z - this.originZ;
    if (y < 0 || y >= this.height) return BlockType.AIR;
    if (paddedX < 0 || paddedX >= PADDED_SIZE || paddedZ < 0 || paddedZ >= PADDED_SIZE) return BlockType.AIR;
    return this.volume[paddedIndex(paddedX, y, paddedZ)];
  }
}
