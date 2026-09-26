import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncChunkGenerator } from '../src/workers/asyncChunkGenerator.js';
import { AsyncChunkMesher } from '../src/workers/asyncChunkMesher.js';
import { InlineExecutor } from '../src/workers/inlineExecutor.js';
import { createChunkJobHandler } from '../src/workers/chunkJobHandler.js';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { chunkBounds, chunkNeighborhood } from '../src/world/chunkLayout.js';
import { createMeshSource } from '../src/world/worldQueries.js';
import { buildChunkMesh } from '../src/render/chunkMesher.js';
import { createTileUvLookup } from '../src/render/blockTiles.js';

const HEIGHT = 64;
const scheduling = { priority: () => 0, isStale: () => false };

test('AsyncChunkGenerator gera o chunk pelo executor', async () => {
  const generator = new AsyncChunkGenerator(new InlineExecutor(createChunkJobHandler()), 11, HEIGHT);
  const blocks = await generator.generate(-3, 4, scheduling);
  assert.deepEqual(blocks, new ChunkGenerator(11, HEIGHT).generate(-3, 4).blocks);
});

test('AsyncChunkMesher monta a malha a partir de um retrato do mundo', async () => {
  const world = new ChunkedWorld(HEIGHT);
  const generator = new ChunkGenerator(11, HEIGHT);
  chunkNeighborhood(1, 1).forEach(({ chunkX, chunkZ }) => world.loadChunk(generator.generate(chunkX, chunkZ)));
  const mesher = new AsyncChunkMesher(new InlineExecutor(createChunkJobHandler()), world);
  const mesh = await mesher.mesh(1, 1, scheduling);
  assert.deepEqual(mesh, buildChunkMesh(createMeshSource(world), chunkBounds(1, 1, HEIGHT), createTileUvLookup()));
});

test('clientes devolvem null quando o job fica obsoleto', async () => {
  const executor = new InlineExecutor(createChunkJobHandler());
  const stale = { priority: () => 0, isStale: () => true };
  assert.equal(await new AsyncChunkGenerator(executor, 1, HEIGHT).generate(0, 0, stale), null);
  assert.equal(await new AsyncChunkMesher(executor, new ChunkedWorld(HEIGHT)).mesh(0, 0, stale), null);
});
