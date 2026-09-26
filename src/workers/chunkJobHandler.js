import { ChunkGenerator } from '../world/chunkGenerator.js';
import { chunkBounds } from '../world/chunkLayout.js';
import { PaddedVolume } from '../world/paddedVolume.js';
import { createMeshSource } from '../world/worldQueries.js';
import { buildChunkMesh } from '../render/chunkMesher.js';
import { createTileUvLookup } from '../render/blockTiles.js';

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

function mesh(tileUv, { height, chunkX, chunkZ, volume }) {
  const source = createMeshSource(new PaddedVolume(volume, chunkX, chunkZ, height));
  const meshData = buildChunkMesh(source, chunkBounds(chunkX, chunkZ, height), tileUv);
  const transfer = [meshData.positions, meshData.normals, meshData.uvs, meshData.colors, meshData.indices]
    .map((array) => array.buffer);
  return { result: meshData, transfer };
}

export function createChunkJobHandler() {
  const generators = new Map();
  const tileUv = createTileUvLookup();
  return (request) => {
    switch (request.type) {
      case JobType.GENERATE:
        return generate(generators, request);
      case JobType.MESH:
        return mesh(tileUv, request);
      default:
        throw new Error(`Tipo de job desconhecido: ${request.type}`);
    }
  };
}
