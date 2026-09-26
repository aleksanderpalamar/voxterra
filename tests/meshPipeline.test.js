import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MeshPipeline } from '../src/render/meshPipeline.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';

const SETTINGS = Object.freeze({ dispatchBudget: 2, uploadBudget: 1 });
const settle = () => new Promise((resolve) => setImmediate(resolve));

class DeferredMesher {
  constructor() {
    this.requests = [];
  }

  mesh(chunkX, chunkZ, scheduling) {
    return new Promise((resolve, reject) => this.requests.push({ chunkX, chunkZ, scheduling, resolve, reject }));
  }

  resolveAll() {
    this.requests.splice(0).forEach((request) => {
      request.resolve(request.scheduling.isStale() ? null : { from: 'worker', chunkX: request.chunkX });
    });
    return settle();
  }
}

class RecordingSink {
  constructor() {
    this.meshes = new Map();
    this.removed = [];
  }

  apply(chunkX, chunkZ, meshData) {
    this.meshes.set(`${chunkX},${chunkZ}`, meshData);
  }

  remove(chunkX, chunkZ) {
    this.removed.push(`${chunkX},${chunkZ}`);
    this.meshes.delete(`${chunkX},${chunkZ}`);
  }
}

function setup(isMeshable = (chunkX, chunkZ) => Math.abs(chunkX) <= 1 && Math.abs(chunkZ) <= 1) {
  const mesher = new DeferredMesher();
  const sink = new RecordingSink();
  const errors = [];
  const pipeline = new MeshPipeline({
    isMeshable,
    mesher,
    meshNow: (chunkX) => ({ from: 'main', chunkX }),
    sink,
    onError: (error) => errors.push(error),
    settings: SETTINGS,
  });
  return { pipeline, mesher, sink, errors };
}

test('update envia jobs pelo orçamento e aplica resultados pelo limite de upload', async () => {
  const { pipeline, mesher, sink } = setup();
  pipeline.handleChunkLoaded(0, 0);
  pipeline.update(0, 0);
  assert.equal(mesher.requests.length, SETTINGS.dispatchBudget);
  await mesher.resolveAll();
  pipeline.update(0, 0);
  assert.equal(sink.meshes.size, 1);
  pipeline.update(0, 0);
  assert.equal(sink.meshes.size, 2);
});

test('edições são montadas na hora e descartam o resultado atrasado do worker', async () => {
  const { pipeline, mesher, sink } = setup();
  pipeline.handleChunkLoaded(0, 0);
  pipeline.update(0, 0);
  const [first] = mesher.requests;
  pipeline.invalidateBlock(first.chunkX * CHUNK_SIZE + 5, first.chunkZ * CHUNK_SIZE + 5);
  pipeline.update(0, 0);
  assert.deepEqual(sink.meshes.get(`${first.chunkX},${first.chunkZ}`), { from: 'main', chunkX: first.chunkX });
  await mesher.resolveAll();
  pipeline.update(0, 0);
  pipeline.update(0, 0);
  assert.deepEqual(sink.meshes.get(`${first.chunkX},${first.chunkZ}`), { from: 'main', chunkX: first.chunkX });
});

test('descarregar remove as malhas afetadas e ignora jobs em andamento', async () => {
  const { pipeline, mesher, sink } = setup();
  pipeline.handleChunkLoaded(0, 0);
  pipeline.update(0, 0);
  pipeline.handleChunkUnloaded(0, 0);
  assert.equal(sink.removed.length, 9);
  await mesher.resolveAll();
  pipeline.update(0, 0);
  assert.equal(sink.meshes.size, 0);
});

test('buildAll conclui com todas as malhas pendentes aplicadas', async () => {
  const { pipeline, mesher, sink } = setup();
  pipeline.handleChunkLoaded(0, 0);
  const building = pipeline.buildAll(0, 0);
  await mesher.resolveAll();
  await building;
  assert.equal(sink.meshes.size, 9);
});

test('falhas são reportadas e o chunk volta para a fila', async () => {
  const { pipeline, mesher, sink, errors } = setup((chunkX, chunkZ) => chunkX === 0 && chunkZ === 0);
  pipeline.handleChunkLoaded(0, 0);
  pipeline.update(0, 0);
  mesher.requests.shift().reject(new Error('worker caiu'));
  await settle();
  assert.equal(errors.length, 1);
  pipeline.update(0, 0);
  await mesher.resolveAll();
  pipeline.update(0, 0);
  assert.equal(sink.meshes.size, 1);
});
