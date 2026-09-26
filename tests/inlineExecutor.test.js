import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InlineExecutor } from '../src/workers/inlineExecutor.js';

const job = (request, overrides = {}) => ({
  build: () => ({ request, transfer: [] }),
  priority: () => 0,
  isStale: () => false,
  ...overrides,
});

test('executa o handler na própria thread e devolve o resultado', async () => {
  const executor = new InlineExecutor((request) => ({ result: request * 2, transfer: [] }));
  assert.equal(await executor.run(job(21)), 42);
});

test('jobs obsoletos resultam em null', async () => {
  const executor = new InlineExecutor(() => assert.fail('não deveria executar'));
  assert.equal(await executor.run(job(1, { isStale: () => true })), null);
});

test('erros do handler rejeitam a promessa', async () => {
  const executor = new InlineExecutor(() => {
    throw new Error('quebrou');
  });
  await assert.rejects(executor.run(job(1)), /quebrou/);
});
