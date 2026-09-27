import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { Chunk } from '../src/world/chunk.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';
import { createEmptyWorld } from './helpers.js';

test('setBlock e getBlock funcionam através de vários chunks', () => {
  const world = createEmptyWorld({ height: 8, chunks: [[0, 0], [-1, 0], [0, -1]] });
  assert.equal(world.setBlock(3, 2, 3, BlockType.STONE), true);
  assert.equal(world.setBlock(-1, 2, 3, BlockType.DIRT), true);
  assert.equal(world.setBlock(3, 2, -CHUNK_SIZE, BlockType.OAK_WOOD), true);
  assert.equal(world.getBlock(3, 2, 3), BlockType.STONE);
  assert.equal(world.getBlock(-1, 2, 3), BlockType.DIRT);
  assert.equal(world.getBlock(3, 2, -CHUNK_SIZE), BlockType.OAK_WOOD);
});

test('posições em chunks não carregados ficam fora do mundo', () => {
  const world = createEmptyWorld({ height: 8 });
  assert.equal(world.contains(CHUNK_SIZE, 1, 1), false);
  assert.equal(world.getBlock(CHUNK_SIZE, 1, 1), BlockType.AIR);
  assert.equal(world.setBlock(CHUNK_SIZE, 1, 1, BlockType.STONE), false);
  assert.equal(world.contains(1, 8, 1), false);
  assert.equal(world.contains(1, 7, 1), true);
});

test('listeners são notificados apenas quando o bloco muda', () => {
  const world = createEmptyWorld({ height: 8 });
  const changes = [];
  world.onBlockChanged((...args) => changes.push(args));
  world.setBlock(1, 1, 1, BlockType.OAK_WOOD);
  world.setBlock(1, 1, 1, BlockType.OAK_WOOD);
  world.setBlock(CHUNK_SIZE, 1, 1, BlockType.OAK_WOOD);
  world.setBlock(1, 1, 1, BlockType.AIR);
  assert.deepEqual(changes, [[1, 1, 1, BlockType.OAK_WOOD, BlockType.AIR], [1, 1, 1, BlockType.AIR, BlockType.OAK_WOOD]]);
});

test('findSurfaceY retorna o bloco sólido mais alto ou null', () => {
  const world = createEmptyWorld({ height: 8 });
  world.setBlock(2, 0, 2, BlockType.STONE);
  world.setBlock(2, 5, 2, BlockType.OAK_LEAVES);
  assert.equal(world.findSurfaceY(2, 2), 5);
  assert.equal(world.findSurfaceY(0, 0), null);
  assert.equal(world.findSurfaceY(CHUNK_SIZE * 3, 0), null);
});

test('loadChunk substitui o chunk carregado na mesma posição', () => {
  const world = new ChunkedWorld(8);
  world.loadChunk(new Chunk(0, 0, 8));
  world.setBlock(1, 1, 1, BlockType.STONE);
  world.loadChunk(new Chunk(0, 0, 8));
  assert.equal(world.getBlock(1, 1, 1), BlockType.AIR);
  assert.equal(world.getChunk(0, 0).chunkX, 0);
  assert.equal(world.getChunk(5, 5), null);
});

test('unloadChunk remove o chunk, limpa o cache e notifica', () => {
  const world = createEmptyWorld({ height: 8 });
  const unloaded = [];
  world.onChunkUnloaded((chunkX, chunkZ) => unloaded.push([chunkX, chunkZ]));
  world.setBlock(1, 1, 1, BlockType.STONE);
  assert.equal(world.getBlock(1, 1, 1), BlockType.STONE);
  assert.equal(world.unloadChunk(0, 0).chunkX, 0);
  assert.equal(world.getBlock(1, 1, 1), BlockType.AIR);
  assert.equal(world.unloadChunk(0, 0), null);
  assert.deepEqual(unloaded, [[0, 0]]);
});

test('loadChunk notifica os ouvintes de carregamento', () => {
  const world = new ChunkedWorld(8);
  const loaded = [];
  world.onChunkLoaded((chunkX, chunkZ) => loaded.push([chunkX, chunkZ]));
  world.loadChunk(new Chunk(2, -3, 8));
  assert.deepEqual(loaded, [[2, -3]]);
  assert.equal(world.hasChunk(2, -3), true);
  assert.deepEqual(world.loadedChunks().map((chunk) => [chunk.chunkX, chunk.chunkZ]), [[2, -3]]);
});

test('hasNeighborhood exige o chunk e os oito vizinhos carregados', () => {
  const coordinates = [];
  for (let chunkZ = -1; chunkZ <= 1; chunkZ++) {
    for (let chunkX = -1; chunkX <= 1; chunkX++) coordinates.push([chunkX, chunkZ]);
  }
  const world = createEmptyWorld({ height: 8, chunks: coordinates });
  assert.equal(world.hasNeighborhood(0, 0), true);
  assert.equal(world.hasNeighborhood(1, 0), false);
  world.unloadChunk(-1, -1);
  assert.equal(world.hasNeighborhood(0, 0), false);
});

test('edições feitas pelo mundo deixam o chunk com alterações não salvas', () => {
  const world = createEmptyWorld({ height: 8, chunks: [[0, 0], [1, 0]] });
  world.getChunk(1, 0).setBlock(CHUNK_SIZE, 1, 1, BlockType.STONE);
  world.setBlock(1, 1, 1, BlockType.DIRT);
  assert.equal(world.getChunk(0, 0).dirty, true);
  assert.equal(world.getChunk(1, 0).dirty, false);
});

test('o evento de descarga entrega o próprio chunk', () => {
  const world = createEmptyWorld({ height: 8 });
  const chunk = world.getChunk(0, 0);
  const received = [];
  world.onChunkUnloaded((chunkX, chunkZ, unloaded) => received.push(unloaded));
  world.unloadChunk(0, 0);
  assert.deepEqual(received, [chunk]);
});
