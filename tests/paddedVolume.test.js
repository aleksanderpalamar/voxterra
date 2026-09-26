import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PADDED_SIZE, PaddedVolume, extractPaddedVolume } from '../src/world/paddedVolume.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE, chunkBounds } from '../src/world/chunkLayout.js';
import { createMeshSource } from '../src/world/worldQueries.js';
import { buildChunkMesh } from '../src/render/chunkMesher.js';
import { createTileUvLookup } from '../src/render/blockTiles.js';
import { createEmptyWorld } from './helpers.js';

const HEIGHT = 64;

function generatedWorld(seed) {
  const world = new ChunkedWorld(HEIGHT);
  const generator = new ChunkGenerator(seed, HEIGHT);
  for (let chunkZ = -1; chunkZ <= 2; chunkZ++) {
    for (let chunkX = -2; chunkX <= 1; chunkX++) world.loadChunk(generator.generate(chunkX, chunkZ));
  }
  return world;
}

function paddedOf(world, chunkX, chunkZ) {
  const volume = extractPaddedVolume((x, z) => world.getChunk(x, z), chunkX, chunkZ, world.height);
  return new PaddedVolume(volume, chunkX, chunkZ, world.height);
}

test('o volume com borda reproduz o chunk e uma camada de cada vizinho', () => {
  const world = generatedWorld(7);
  const padded = paddedOf(world, -1, 0);
  const minX = -CHUNK_SIZE - 1;
  for (let y = 0; y < HEIGHT; y += 3) {
    for (let z = -1; z <= CHUNK_SIZE; z++) {
      for (let x = minX; x < minX + PADDED_SIZE; x++) {
        assert.equal(padded.getBlock(x, y, z), world.getBlock(x, y, z), `divergência em ${x},${y},${z}`);
      }
    }
  }
});

test('posições fora do volume retornam ar', () => {
  const world = createEmptyWorld({ height: 8, chunks: [[0, 0]] });
  world.setBlock(0, 0, 0, BlockType.STONE);
  const padded = paddedOf(world, 0, 0);
  assert.equal(padded.getBlock(0, 0, 0), BlockType.STONE);
  assert.equal(padded.getBlock(-2, 0, 0), BlockType.AIR);
  assert.equal(padded.getBlock(0, 8, 0), BlockType.AIR);
  assert.equal(padded.getBlock(CHUNK_SIZE, 0, 0), BlockType.AIR);
});

test('a malha montada a partir do volume é idêntica à montada do mundo', () => {
  const world = generatedWorld(2024);
  const tileUv = createTileUvLookup();
  [[0, 0], [-1, 1]].forEach(([chunkX, chunkZ]) => {
    const bounds = chunkBounds(chunkX, chunkZ, HEIGHT);
    const fromWorld = buildChunkMesh(createMeshSource(world), bounds, tileUv);
    const fromVolume = buildChunkMesh(createMeshSource(paddedOf(world, chunkX, chunkZ)), bounds, tileUv);
    assert.ok(fromWorld.solid.indices.length > 0);
    assert.deepEqual(fromVolume, fromWorld);
  });
});
