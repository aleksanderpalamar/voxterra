import { BlockType } from './blockTypes.js';
import { createRandom } from '../core/random.js';
import { createNoise2D } from '../core/noise.js';
import { createHeightMap, fillTerrain } from './terrainGenerator.js';
import { planTrees, placeTree } from './treeGenerator.js';

const CEILING_MARGIN = 10;
const SPAWN_SEARCH_RADIUS = 12;

export function generateWorld(world, seed) {
  const random = createRandom(seed);
  const noise = createNoise2D(random);
  const heightMap = createHeightMap(noise, world.sizeX, world.sizeZ, world.sizeY - CEILING_MARGIN);
  fillTerrain(world, heightMap);
  const isFertile = (x, z) => world.getBlock(x, heightMap.heightAt(x, z), z) === BlockType.GRASS;
  planTrees(random, heightMap, isFertile).forEach((tree) => placeTree(world, tree));
  return heightMap;
}

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

export function findSpawnPoint(world) {
  const centerX = Math.floor(world.sizeX / 2);
  const centerZ = Math.floor(world.sizeZ / 2);
  const column = spawnCandidates(centerX, centerZ, SPAWN_SEARCH_RADIUS)
    .find((candidate) => isGrassColumn(world, candidate)) ?? { x: centerX, z: centerZ };
  const surfaceY = world.findSurfaceY(column.x, column.z) ?? -1;
  return { x: column.x + 0.5, y: surfaceY + 1, z: column.z + 0.5 };
}
