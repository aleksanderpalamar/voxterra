import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JobType, createChunkJobHandler } from '../src/workers/chunkJobHandler.js';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { chunkBounds, chunkNeighborhood } from '../src/world/chunkLayout.js';
import { extractPaddedVolume } from '../src/world/paddedVolume.js';
import { createMeshSource } from '../src/world/worldQueries.js';
import { buildChunkMesh } from '../src/render/chunkMesher.js';
import { createTileUvLookup } from '../src/render/blockTiles.js';
import { createChunkTint } from '../src/render/chunkTint.js';
import { ClimateSampler } from '../src/world/climate.js';

const HEIGHT = 64;

test('job de geração devolve os mesmos blocos do gerador e transfere o buffer', () => {
  const handle = createChunkJobHandler();
  const { result, transfer } = handle({ type: JobType.GENERATE, seed: 9, height: HEIGHT, chunkX: 2, chunkZ: -1 });
  assert.deepEqual(result.blocks, new ChunkGenerator(9, HEIGHT).generate(2, -1).blocks);
  assert.deepEqual(transfer, [result.blocks.buffer]);
});

test('job de malha reproduz a malha montada a partir do mundo', () => {
  const generator = new ChunkGenerator(3, HEIGHT);
  const world = new ChunkedWorld(HEIGHT);
  chunkNeighborhood(0, 0).forEach(({ chunkX, chunkZ }) => world.loadChunk(generator.generate(chunkX, chunkZ)));
  const volume = extractPaddedVolume((x, z) => world.getChunk(x, z), 0, 0, HEIGHT);
  const { result, transfer } = createChunkJobHandler()({ type: JobType.MESH, seed: 3, height: HEIGHT, chunkX: 0, chunkZ: 0, volume });
  const bounds = chunkBounds(0, 0, HEIGHT);
  const climate = new ClimateSampler(3);
  const tintAt = createChunkTint((x, z) => climate.sample(x, z), bounds);
  const expected = buildChunkMesh(createMeshSource(world), bounds, createTileUvLookup(), tintAt);
  assert.deepEqual(result, expected);
  assert.ok(result.solid.tints.some((channel) => channel !== 1), 'a malha gerada deveria ter grama ou folhas com tonalidade');
  assert.equal(transfer.length, 12);
  assert.ok(transfer.includes(result.solid.indices.buffer));
  assert.ok(transfer.includes(result.water.positions.buffer));
});

test('tipo de job desconhecido gera erro explícito', () => {
  assert.throws(() => createChunkJobHandler()({ type: 'voar' }), /voar/);
});
