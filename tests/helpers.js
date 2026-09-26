import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { Chunk } from '../src/world/chunk.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';

export function createEmptyWorld({ height = 16, chunks = [[0, 0]] } = {}) {
  const world = new ChunkedWorld(height);
  chunks.forEach(([chunkX, chunkZ]) => world.loadChunk(new Chunk(chunkX, chunkZ, height)));
  return world;
}

export function createFlatWorld({ height = 16, groundY = 4, block = BlockType.STONE } = {}) {
  const world = createEmptyWorld({ height });
  for (let z = 0; z < CHUNK_SIZE; z++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y <= groundY; y++) world.setBlock(x, y, z, block);
    }
  }
  return world;
}

export function solidSet(cells) {
  const keys = new Set(cells.map(([x, y, z]) => `${x},${y},${z}`));
  return (x, y, z) => keys.has(`${x},${y},${z}`);
}
