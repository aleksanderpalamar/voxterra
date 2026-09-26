export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 64;

const KEY_OFFSET = 2 ** 20;
const KEY_STRIDE = 2 ** 21;

export function chunkCoordinate(blockCoordinate) {
  return Math.floor(blockCoordinate / CHUNK_SIZE);
}

export function chunkKey(chunkX, chunkZ) {
  return (chunkX + KEY_OFFSET) * KEY_STRIDE + (chunkZ + KEY_OFFSET);
}

export function chunkVolume(height) {
  return CHUNK_SIZE * CHUNK_SIZE * height;
}

export function chunkBlockIndex(localX, y, localZ) {
  return localX + CHUNK_SIZE * (localZ + CHUNK_SIZE * y);
}

export function chunkNeighborhood(chunkX, chunkZ) {
  const neighborhood = [];
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) neighborhood.push({ chunkX: chunkX + dx, chunkZ: chunkZ + dz });
  }
  return neighborhood;
}

export function chunkBounds(chunkX, chunkZ, height) {
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  return { minX, minY: 0, minZ, maxX: minX + CHUNK_SIZE, maxY: height, maxZ: minZ + CHUNK_SIZE };
}
