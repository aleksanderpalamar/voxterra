import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorldAutosave } from '../src/persistence/worldAutosave.js';
import { MemoryWorldStore } from '../src/persistence/memoryWorldStore.js';
import { parseWorldMetadata } from '../src/persistence/worldMetadata.js';
import { ChunkStreamer } from '../src/world/chunkStreamer.js';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';
import { createEmptyWorld } from './helpers.js';

const player = { snapshot: () => ({ x: 1, y: 2, z: 3, yaw: 0.1, pitch: 0.2 }) };

function setup(store = new MemoryWorldStore()) {
  const world = createEmptyWorld({ height: 8, chunks: [[0, 0], [1, 0]] });
  const errors = [];
  const autosave = new WorldAutosave({ world, store, player, seed: 77, interval: 5, onError: (error) => errors.push(error) });
  return { world, store, autosave, errors };
}

test('saveNow grava chunks alterados e os metadados do mundo', async () => {
  const { world, store, autosave } = setup();
  world.setBlock(1, 1, 1, BlockType.WOOD);
  await autosave.saveNow();
  assert.equal(store.hasChunk(0, 0), true);
  assert.equal(store.hasChunk(1, 0), false);
  assert.equal(world.getChunk(0, 0).dirty, false);
  const metadata = parseWorldMetadata(await store.loadMetadata());
  assert.equal(metadata.seed, 77);
  assert.deepEqual(metadata.player, player.snapshot());
});

test('update só salva depois do intervalo configurado', async () => {
  const { world, store, autosave } = setup();
  world.setBlock(1, 1, 1, BlockType.WOOD);
  await autosave.update(4.9);
  assert.equal(store.hasChunk(0, 0), false);
  await autosave.update(0.2);
  assert.equal(store.hasChunk(0, 0), true);
});

test('edições feitas depois de salvar voltam a ficar pendentes', async () => {
  const { world, autosave } = setup();
  world.setBlock(1, 1, 1, BlockType.WOOD);
  await autosave.saveNow();
  world.setBlock(2, 1, 1, BlockType.WOOD);
  assert.equal(world.getChunk(0, 0).dirty, true);
});

test('chunks alterados são salvos ao serem descarregados', () => {
  const { world, store } = setup();
  world.setBlock(CHUNK_SIZE + 1, 1, 1, BlockType.STONE);
  world.unloadChunk(1, 0);
  world.unloadChunk(0, 0);
  assert.equal(store.hasChunk(1, 0), true);
  assert.equal(store.hasChunk(0, 0), false);
});

test('discard interrompe qualquer gravação futura', async () => {
  const { world, store, autosave } = setup();
  await autosave.discard();
  world.setBlock(1, 1, 1, BlockType.WOOD);
  await autosave.saveNow();
  world.unloadChunk(0, 0);
  assert.equal(store.hasChunk(0, 0), false);
  assert.equal(await store.loadMetadata(), null);
});

test('falhas de gravação são reportadas e o chunk continua pendente', async () => {
  const failing = new MemoryWorldStore();
  failing.saveChunk = async () => {
    throw new Error('disco cheio');
  };
  const { world, autosave, errors } = setup(failing);
  world.setBlock(1, 1, 1, BlockType.WOOD);
  await autosave.saveNow();
  assert.equal(errors.length, 1);
  assert.equal(world.getChunk(0, 0).dirty, true);
});

test('edições sobrevivem ao sair e voltar para a região', async () => {
  const store = new MemoryWorldStore();
  const world = createEmptyWorld({ height: 64, chunks: [] });
  const generator = new ChunkGenerator(3, 64);
  const asyncGenerator = { generate: async (chunkX, chunkZ) => generator.generate(chunkX, chunkZ).blocks };
  const settings = { loadRadius: 1, unloadRadius: 2, maxInFlight: 8 };
  const streamer = new ChunkStreamer({ world, generator: asyncGenerator, store, settings });
  new WorldAutosave({ world, store, player, seed: 3 });
  await streamer.loadAround({ x: 0, z: 0 });
  world.setBlock(3, 62, 3, BlockType.WOOD);
  await streamer.loadAround({ x: CHUNK_SIZE * 20, z: 0 });
  assert.equal(world.hasChunk(0, 0), false);
  await streamer.loadAround({ x: 0, z: 0 });
  assert.equal(world.getBlock(3, 62, 3), BlockType.WOOD);
});

test('erase apaga o mundo salvo e impede novas gravações', async () => {
  const { world, store, autosave } = setup();
  world.setBlock(1, 1, 1, BlockType.WOOD);
  await autosave.saveNow();
  await autosave.erase();
  await autosave.saveNow();
  assert.equal(store.hasChunk(0, 0), false);
  assert.equal(await store.loadMetadata(), null);
});
