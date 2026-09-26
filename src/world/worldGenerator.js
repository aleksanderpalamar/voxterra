import { BlockType } from './blockTypes.js';

const SPAWN_SEARCH_RADIUS = 12;

function spawnCandidates(centerX, centerZ, radius) {
  const candidates = [];
  for (let ring = 0; ring <= radius; ring++) {
    for (let dz = -ring; dz <= ring; dz++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
        candidates.push({ x: centerX + dx, z: centerZ + dz });
      }
    }
  }
  return candidates;
}

function isGrassColumn(world, column) {
  const surfaceY = world.findSurfaceY(column.x, column.z);
  if (surfaceY === null) return false;
  return world.getBlock(column.x, surfaceY, column.z) === BlockType.GRASS;
}

export function findSpawnPoint(world, centerX, centerZ) {
  const originX = Math.floor(centerX);
  const originZ = Math.floor(centerZ);
  const column = spawnCandidates(originX, originZ, SPAWN_SEARCH_RADIUS)
    .find((candidate) => isGrassColumn(world, candidate)) ?? { x: originX, z: originZ };
  const surfaceY = world.findSurfaceY(column.x, column.z) ?? -1;
  return { x: column.x + 0.5, y: surfaceY + 1, z: column.z + 0.5 };
}
