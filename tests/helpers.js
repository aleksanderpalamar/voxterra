import { World } from '../src/world/world.js';
import { BlockType } from '../src/world/blockTypes.js';

export function createFlatWorld({ size = 16, height = 16, groundY = 4, block = BlockType.STONE } = {}) {
  const world = new World(size, height, size);
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y <= groundY; y++) world.setBlock(x, y, z, block);
    }
  }
  return world;
}

export function solidSet(cells) {
  const keys = new Set(cells.map(([x, y, z]) => `${x},${y},${z}`));
  return (x, y, z) => keys.has(`${x},${y},${z}`);
}
