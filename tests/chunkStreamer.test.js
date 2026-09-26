import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkStreamer } from '../src/world/chunkStreamer.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { MemoryChunkStore } from '../src/world/memoryChunkStore.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE, chunkBlockIndex, chunkVolume } from '../src/world/chunkLayout.js';

const HEIGHT = 4;
const SETTINGS = Object.freeze({ loadRadius: 2, unloadRadius: 3, maxInFlight: 3 });

class DeferredGenerator {
  constructor() {
    this.requests = [];
  }

  generate(chunkX, chunkZ, scheduling) {
    return new Promise((resolve, reject) => this.requests.push({ chunkX, chunkZ, scheduling, resolve, reject }));
  }

  flatBlocks() {
    const blocks = new Uint8Array(chunkVolume(HEIGHT));
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) blocks[chunkBlockIndex(x, 0, z)] = BlockType.STONE;
    }
    return blocks;
  }

  async resolveAll() {
    while (this.requests.length > 0) {
      const pending = this.requests.splice(0);
      pending.forEach((request) => request.resolve(request.scheduling.isStale() ? null : this.flatBlocks()));
      await Promise.resolve();
      await Promise.resolve();
    }
  }
}

function setup() {
  const world = new ChunkedWorld(HEIGHT);
  const generator = new DeferredGenerator();
  const store = new MemoryChunkStore();
  const errors = [];
  const streamer = new ChunkStreamer({
    world, generator, store, settings: SETTINGS, onError: (error) => errors.push(error),
  });
  return { world, generator, store, streamer, errors };
}

const at = (chunkX, chunkZ) => ({ x: chunkX * CHUNK_SIZE + 8, y: 1, z: chunkZ * CHUNK_SIZE + 8 });
const settle = () => new Promise((resolve) => setImmediate(resolve));

async function loadAround(context, position) {
  const loading = context.streamer.loadAround(position);
  await context.generator.resolveAll();
  await loading;
}

test('loadAround conclui quando todos os chunks do raio estão carregados', async () => {
  const context = setup();
  await loadAround(context, at(0, 0));
  assert.equal(context.world.loadedChunks().length, 13);
  assert.equal(context.world.hasChunk(2, 1), false);
  assert.equal(context.streamer.pendingCount, 0);
});

test('update limita as gerações em andamento e começa pelos mais próximos', async () => {
  const { world, generator, streamer } = setup();
  streamer.update(at(0, 0));
  assert.equal(generator.requests.length, SETTINGS.maxInFlight);
  assert.deepEqual([generator.requests[0].chunkX, generator.requests[0].chunkZ], [0, 0]);
  streamer.update(at(0, 0));
  assert.equal(generator.requests.length, SETTINGS.maxInFlight);
  while (world.loadedChunks().length < 13) {
    await generator.resolveAll();
    streamer.update(at(0, 0));
  }
  assert.equal(world.loadedChunks().length, 13);
});

test('prioridade das gerações acompanha a posição atual do jogador', () => {
  const { generator, streamer } = setup();
  streamer.update(at(0, 0));
  const [request] = generator.requests;
  const before = request.scheduling.priority();
  streamer.update(at(5, 0));
  assert.ok(request.scheduling.priority() > before);
});

test('resultados de chunks que deixaram de ser necessários são descartados', async () => {
  const { world, generator, streamer } = setup();
  streamer.update(at(0, 0));
  const pending = generator.requests.splice(0);
  streamer.update(at(20, 0));
  pending.forEach((request) => request.resolve(generator.flatBlocks()));
  await settle();
  assert.ok(world.loadedChunks().every((chunk) => chunk.chunkX >= 17));
  assert.ok(pending.every((request) => request.scheduling.isStale()));
});

test('chunks além do raio de descarte são removidos quando o jogador se afasta', async () => {
  const context = setup();
  await loadAround(context, at(0, 0));
  await loadAround(context, at(10, 0));
  assert.equal(context.world.hasChunk(0, 0), false);
  assert.ok(context.world.loadedChunks().every((chunk) => Math.hypot(chunk.chunkX - 10, chunk.chunkZ) <= 3));
});

test('edições sobrevivem ao descarregar e recarregar o chunk', async () => {
  const context = setup();
  await loadAround(context, at(0, 0));
  context.world.setBlock(3, 2, 3, BlockType.WOOD);
  await loadAround(context, at(10, 0));
  assert.notEqual(context.store.load(0, 0), null);
  const loading = context.streamer.loadAround(at(0, 0));
  assert.ok(!context.generator.requests.some((request) => request.chunkX === 0 && request.chunkZ === 0));
  await context.generator.resolveAll();
  await loading;
  assert.equal(context.world.getBlock(3, 2, 3), BlockType.WOOD);
  assert.equal(context.world.getChunk(0, 0).modified, true);
});

test('chunks não modificados não são guardados no store', async () => {
  const context = setup();
  await loadAround(context, at(0, 0));
  await loadAround(context, at(10, 0));
  assert.equal(context.store.load(0, 0), null);
});

test('falhas de geração são reportadas e o chunk volta para a fila', async () => {
  const { world, generator, streamer, errors } = setup();
  streamer.update(at(0, 0));
  const failed = generator.requests.shift();
  failed.reject(new Error('worker caiu'));
  await settle();
  assert.equal(errors.length, 1);
  while (!world.hasChunk(failed.chunkX, failed.chunkZ)) {
    streamer.update(at(0, 0));
    await generator.resolveAll();
  }
  assert.equal(world.hasChunk(failed.chunkX, failed.chunkZ), true);
});
