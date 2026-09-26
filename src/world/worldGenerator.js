import { BlockType } from './blockTypes.js';
import { SEA_LEVEL } from './terrainShape.js';

const SPAWN_SEARCH_RADIUS = 12;
const LAND_SEARCH_RADIUS = 2048;
const LAND_SEARCH_STEP = 16;

function ringCandidates(centerX, centerZ, ring, step) {
  const candidates = [];
  for (let dz = -ring; dz <= ring; dz += step) {
    for (let dx = -ring; dx <= ring; dx += step) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
      candidates.push({ x: centerX + dx, z: centerZ + dz });
    }
  }
  return candidates;
}

function spawnCandidates(centerX, centerZ, radius, step = 1) {
  const candidates = [];
  for (let ring = 0; ring <= radius; ring += step) candidates.push(...ringCandidates(centerX, centerZ, ring, step));
  return candidates;
}

function isDryGrass(column) {
  return column.surfaceY > SEA_LEVEL && column.surface.top === BlockType.GRASS;
}

export function findLandCenter(columnAt, origin, maxRadius = LAND_SEARCH_RADIUS) {
  for (let ring = 0; ring <= maxRadius; ring += LAND_SEARCH_STEP) {
    const found = ringCandidates(origin.x, origin.z, ring, LAND_SEARCH_STEP)
      .find((candidate) => isDryGrass(columnAt(candidate.x, candidate.z)));
    if (found !== undefined) return found;
  }
  return { x: origin.x, z: origin.z };
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
