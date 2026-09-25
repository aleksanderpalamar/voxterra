import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FpsCounter } from '../src/hud/fpsCounter.js';

test('FpsCounter só reporta após completar a janela de amostragem', () => {
  const counter = new FpsCounter(0.5);
  const reports = Array.from({ length: 4 }, () => counter.tick(0.125));
  assert.deepEqual(reports, [null, null, null, 8]);
});

test('FpsCounter reinicia a contagem após cada relatório', () => {
  const counter = new FpsCounter(0.5);
  for (let i = 0; i < 4; i++) counter.tick(0.125);
  assert.equal(counter.tick(0.25), null);
  assert.equal(counter.tick(0.25), 4);
});
