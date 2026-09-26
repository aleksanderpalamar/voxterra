import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerPool } from '../src/workers/workerPool.js';

class FakeWorker extends EventTarget {
  constructor(log) {
    super();
    this.log = log;
    this.inbox = [];
  }

  postMessage(message, transfer) {
    this.log.push({ worker: this, message, transfer });
    this.inbox.push(message);
  }

  reply(result) {
    const { id } = this.inbox.shift();
    this.dispatchEvent(Object.assign(new Event('message'), { data: { id, result } }));
  }

  replyError(error) {
    const { id } = this.inbox.shift();
    this.dispatchEvent(Object.assign(new Event('message'), { data: { id, error } }));
  }

  crash() {
    this.inbox.shift();
    this.dispatchEvent(Object.assign(new Event('error'), { message: 'falha fatal' }));
  }
}

function createPool(size) {
  const log = [];
  const workers = [];
  const pool = new WorkerPool(() => {
    const worker = new FakeWorker(log);
    workers.push(worker);
    return worker;
  }, size);
  return { pool, log, workers };
}

const job = (name, overrides = {}) => ({
  build: () => ({ request: { name }, transfer: [] }),
  priority: () => 0,
  isStale: () => false,
  ...overrides,
});

test('pool executa no máximo um job por worker e entrega o resultado', async () => {
  const { pool, log, workers } = createPool(2);
  const results = ['a', 'b', 'c'].map((name) => pool.run(job(name)));
  assert.equal(log.length, 2);
  workers[0].reply('A');
  assert.equal(await results[0], 'A');
  assert.equal(log.length, 3);
  assert.equal(log[2].worker, workers[0]);
});

test('o job de menor prioridade é enviado primeiro, avaliado na hora do envio', async () => {
  const { pool, log, workers } = createPool(1);
  let farPriority = 1;
  pool.run(job('primeiro'));
  pool.run(job('longe', { priority: () => farPriority }));
  pool.run(job('perto', { priority: () => 5 }));
  farPriority = 10;
  workers[0].reply(null);
  assert.equal(log[1].message.request.name, 'perto');
});

test('jobs obsoletos são descartados sem montar a requisição', async () => {
  const { pool, log, workers } = createPool(1);
  let built = false;
  pool.run(job('ocupando'));
  const stale = pool.run(job('obsoleto', {
    isStale: () => true,
    build: () => {
      built = true;
      return { request: {}, transfer: [] };
    },
  }));
  workers[0].reply(null);
  assert.equal(await stale, null);
  assert.equal(built, false);
  assert.equal(log.length, 1);
});

test('erros reportados pelo worker rejeitam apenas o job correspondente', async () => {
  const { pool, workers } = createPool(1);
  const failing = pool.run(job('ruim'));
  const next = pool.run(job('bom'));
  workers[0].replyError('explodiu');
  await assert.rejects(failing, /explodiu/);
  workers[0].reply('ok');
  assert.equal(await next, 'ok');
});

test('falha fatal do worker rejeita o job em andamento e o pool continua', async () => {
  const { pool, workers } = createPool(1);
  const crashed = pool.run(job('x'));
  const next = pool.run(job('y'));
  workers[0].crash();
  await assert.rejects(crashed, /falha fatal/);
  workers[0].reply('y');
  assert.equal(await next, 'y');
});

test('transferables vão junto com a mensagem', () => {
  const { pool, log } = createPool(1);
  const buffer = new ArrayBuffer(8);
  pool.run(job('t', { build: () => ({ request: {}, transfer: [buffer] }) }));
  assert.deepEqual(log[0].transfer, [buffer]);
});
