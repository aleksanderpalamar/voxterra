import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkStreamer } from '../src/world/chunkStreamer.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { MemoryChunkStore } from '../src/world/memoryChunkStore.js';
import { Chunk } from '../src/world/chunk.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';

const HEIGHT = 4;
const SETTINGS = Object.freeze({ loadRadius: 2, unloadRadius: 3, generationBudget: 3 });

class FlatGenerator {
  constructor() {
    this.generated = [];
  }

  generate(chunkX, chunkZ) {
    this.generated.push([chunkX, chunkZ]);
    const chunk = new Chunk(chunkX, chunkZ, HEIGHT);
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) chunk.setBlock(chunk.originX + x, 0, chunk.originZ + z, BlockType.STONE);
    }
    return chunk;
  }
}

function setup() {
  const world = new ChunkedWorld(HEIGHT);
  const generator = new FlatGenerator();
  const store = new MemoryChunkStore();
  return { world, generator, store, streamer: new ChunkStreamer(world, generator, store, SETTINGS) };
}

const at = (chunkX, chunkZ) => ({ x: chunkX * CHUNK_SIZE + 8, y: 1, z: chunkZ * CHUNK_SIZE + 8 });

test('loadAround carrega todos os chunks dentro do raio', () => {
  const { world, streamer } = setup();
  streamer.loadAround(at(0, 0));
  assert.equal(world.loadedChunks().length, 13);
  assert.equal(world.hasChunk(2, 0), true);
  assert.equal(world.hasChunk(2, 1), false);
  assert.equal(streamer.pendingCount, 0);
});

test('update respeita o orçamento por frame e começa pelos mais próximos', () => {
  const { world, generator, streamer } = setup();
  streamer.update(at(0, 0));
  assert.equal(world.loadedChunks().length, SETTINGS.generationBudget);
  assert.deepEqual(generator.generated[0], [0, 0]);
  while (streamer.pendingCount > 0) streamer.update(at(0, 0));
  assert.equal(world.loadedChunks().length, 13);
});

test('chunks além do raio de descarte são removidos quando o jogador se afasta', () => {
  const { world, streamer } = setup();
  streamer.loadAround(at(0, 0));
  streamer.loadAround(at(10, 0));
  assert.equal(world.hasChunk(0, 0), false);
  assert.equal(world.hasChunk(10, 0), true);
  assert.ok(world.loadedChunks().every((chunk) => Math.hypot(chunk.chunkX - 10, chunk.chunkZ) <= SETTINGS.unloadRadius));
});

test('edições sobrevivem ao descarregar e recarregar o chunk', () => {
  const { world, generator, store, streamer } = setup();
  streamer.loadAround(at(0, 0));
  world.setBlock(3, 2, 3, BlockType.WOOD);
  streamer.loadAround(at(10, 0));
  assert.notEqual(store.load(0, 0), null);
  generator.generated.length = 0;
  streamer.loadAround(at(0, 0));
  assert.equal(world.getBlock(3, 2, 3), BlockType.WOOD);
  assert.ok(!generator.generated.some(([chunkX, chunkZ]) => chunkX === 0 && chunkZ === 0));
  assert.equal(world.getChunk(0, 0).modified, true);
});

test('chunks não modificados não são guardados no store', () => {
  const { store, streamer } = setup();
  streamer.loadAround(at(0, 0));
  streamer.loadAround(at(10, 0));
  assert.equal(store.load(0, 0), null);
});
