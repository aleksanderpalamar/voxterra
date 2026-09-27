import { ChunkGenerator } from '../world/chunkGenerator.js';
import { chunkBounds } from '../world/chunkLayout.js';
import { PaddedVolume } from '../world/paddedVolume.js';
import { createMeshSource } from '../world/worldQueries.js';
import { buildChunkMesh } from '../render/chunkMesher.js';
import { createTileUvLookup } from '../render/blockTiles.js';
import { meshDataArrays } from '../render/meshBuffers.js';
import { createChunkTint } from '../render/chunkTint.js';
import { ClimateSampler } from '../world/climate.js';

export const JobType = Object.freeze({
  GENERATE: 'generate',
  MESH: 'mesh',
});

function generatorFor(cache, seed, height) {
  const key = `${seed}:${height}`;
  if (!cache.has(key)) cache.set(key, new ChunkGenerator(seed, height));
  return cache.get(key);
}

function generate(cache, { seed, height, chunkX, chunkZ }) {
  const { blocks } = generatorFor(cache, seed, height).generate(chunkX, chunkZ);
  return { result: { blocks }, transfer: [blocks.buffer] };
}

function climateFor(cache, seed) {
  if (!cache.has(seed)) cache.set(seed, new ClimateSampler(seed));
  return cache.get(seed);
}

function mesh(tileUv, climates, { seed, height, chunkX, chunkZ, volume }) {
  const source = createMeshSource(new PaddedVolume(volume, chunkX, chunkZ, height));
  const bounds = chunkBounds(chunkX, chunkZ, height);
  const climate = climateFor(climates, seed);
  const tintAt = createChunkTint((x, z) => climate.sample(x, z), bounds);
  const meshData = buildChunkMesh(source, bounds, tileUv, tintAt);
  const transfer = [...meshDataArrays(meshData.solid), ...meshDataArrays(meshData.water)].map((array) => array.buffer);
  return { result: meshData, transfer };
}

export function createChunkJobHandler() {
  const generators = new Map();
  const climates = new Map();
  const tileUv = createTileUvLookup();
  return (request) => {
    switch (request.type) {
      case JobType.GENERATE:
        return generate(generators, request);
      case JobType.MESH:
        return mesh(tileUv, climates, request);
      default:
        throw new Error(`Tipo de job desconhecido: ${request.type}`);
    }
  };
}
