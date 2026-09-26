import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MeshScheduler } from '../src/render/meshScheduler.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';

const coordinates = (chunks) => chunks.map(({ chunkX, chunkZ }) => [chunkX, chunkZ]).sort();
const meshableWithin = (radius) => (chunkX, chunkZ) => Math.abs(chunkX) <= radius && Math.abs(chunkZ) <= radius;

test('chunkLoaded agenda apenas os chunks montáveis da vizinhança', () => {
  const scheduler = new MeshScheduler((chunkX, chunkZ) => chunkX === 0 && chunkZ <= 0);
  scheduler.chunkLoaded(0, 0);
  assert.equal(scheduler.pendingCount, 2);
  assert.deepEqual(coordinates(scheduler.takeNearest(10, 0, 0)), [[0, -1], [0, 0]]);
});

test('takeNearest respeita o orçamento e a ordem de distância', () => {
  const scheduler = new MeshScheduler(meshableWithin(5));
  scheduler.chunkLoaded(0, 0);
  scheduler.chunkLoaded(4, 4);
  const first = scheduler.takeNearest(2, 4, 4);
  assert.equal(first.length, 2);
  assert.deepEqual(first[0], { chunkX: 4, chunkZ: 4 });
  assert.equal(scheduler.pendingCount, 16);
});

test('chunkUnloaded devolve a vizinhança afetada e cancela o que estava pendente', () => {
  const scheduler = new MeshScheduler(meshableWithin(5));
  scheduler.chunkLoaded(0, 0);
  const affected = scheduler.chunkUnloaded(1, 1);
  assert.equal(affected.length, 9);
  assert.ok(affected.some(({ chunkX, chunkZ }) => chunkX === 1 && chunkZ === 1));
  assert.equal(scheduler.pendingCount, 5);
});

test('blockChanged marca como urgentes os chunks afetados pela borda', () => {
  const scheduler = new MeshScheduler(meshableWithin(5));
  scheduler.blockChanged(5, 5);
  assert.deepEqual(coordinates(scheduler.takeUrgent()), [[0, 0]]);
  scheduler.blockChanged(CHUNK_SIZE, CHUNK_SIZE);
  assert.deepEqual(coordinates(scheduler.takeUrgent()), [[0, 0], [0, 1], [1, 0], [1, 1]]);
  assert.deepEqual(scheduler.takeUrgent(), []);
});

test('blockChanged ignora chunks que não podem ser montados', () => {
  const scheduler = new MeshScheduler(meshableWithin(0));
  scheduler.blockChanged(CHUNK_SIZE - 1, 3);
  assert.deepEqual(coordinates(scheduler.takeUrgent()), [[0, 0]]);
});

test('chunks urgentes saem da fila normal', () => {
  const scheduler = new MeshScheduler(meshableWithin(5));
  scheduler.chunkLoaded(0, 0);
  scheduler.blockChanged(5, 5);
  scheduler.takeUrgent();
  assert.ok(!scheduler.takeNearest(20, 0, 0).some(({ chunkX, chunkZ }) => chunkX === 0 && chunkZ === 0));
});
