import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MigrationResult, migrateLegacyWorld } from '../src/persistence/worldMigration.js';
import { MemoryWorldStore } from '../src/persistence/memoryWorldStore.js';

const metadata = { version: 1, seed: 42, player: { x: 1, y: 2, z: 3, yaw: 0, pitch: 0 }, savedAt: 1 };

async function legacyWithCabin() {
  const legacy = new MemoryWorldStore();
  await legacy.saveChunk(0, 0, new Uint8Array([4, 4, 4]));
  await legacy.saveChunk(-1, 2, new Uint8Array([3]));
  await legacy.saveMetadata(metadata);
  return legacy;
}

function migrationOf(target, legacy) {
  const calls = { opened: 0, deleted: [] };
  const run = migrateLegacyWorld({
    target,
    openLegacy: async () => {
      calls.opened += 1;
      return legacy;
    },
    deleteLegacy: async (store) => {
      calls.deleted.push(store);
    },
  });
  return { run, calls };
}

test('o save antigo é copiado para o banco novo e o antigo é apagado', async () => {
  const target = new MemoryWorldStore();
  const legacy = await legacyWithCabin();
  const { run, calls } = migrationOf(target, legacy);
  assert.equal(await run, MigrationResult.MIGRATED);
  assert.deepEqual(await target.loadMetadata(), metadata);
  assert.deepEqual(await target.loadChunk(0, 0), new Uint8Array([4, 4, 4]));
  assert.deepEqual(await target.loadChunk(-1, 2), new Uint8Array([3]));
  assert.deepEqual(calls.deleted, [legacy]);
});

test('um banco novo que já tem save não é tocado', async () => {
  const target = new MemoryWorldStore();
  await target.saveMetadata({ ...metadata, seed: 7 });
  const { run, calls } = migrationOf(target, await legacyWithCabin());
  assert.equal(await run, MigrationResult.TARGET_HAS_SAVE);
  assert.equal(calls.opened, 0);
  assert.equal((await target.loadMetadata()).seed, 7);
});

test('sem banco antigo não há o que migrar', async () => {
  const { run, calls } = migrationOf(new MemoryWorldStore(), null);
  assert.equal(await run, MigrationResult.NO_LEGACY_SAVE);
  assert.deepEqual(calls.deleted, []);
});

test('banco antigo sem save é apenas removido', async () => {
  const target = new MemoryWorldStore();
  const legacy = new MemoryWorldStore();
  const { run, calls } = migrationOf(target, legacy);
  assert.equal(await run, MigrationResult.NO_LEGACY_SAVE);
  assert.deepEqual(calls.deleted, [legacy]);
  assert.equal(await target.loadMetadata(), null);
});

test('falha no meio da cópia preserva o banco antigo e não marca a migração como feita', async () => {
  const target = new MemoryWorldStore();
  let saved = 0;
  target.saveChunk = async () => {
    saved += 1;
    if (saved === 2) throw new Error('cota excedida');
  };
  const { run, calls } = migrationOf(target, await legacyWithCabin());
  await assert.rejects(run, /cota excedida/);
  assert.deepEqual(calls.deleted, []);
  assert.equal(await target.loadMetadata(), null);
});
