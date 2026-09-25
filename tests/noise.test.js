import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom } from '../src/core/random.js';
import { createNoise2D, fractalNoise2D } from '../src/core/noise.js';

test('noise é determinístico para a mesma seed', () => {
  const a = createNoise2D(createRandom(10));
  const b = createNoise2D(createRandom(10));
  assert.equal(a(3.7, -12.2), b(3.7, -12.2));
});

test('noise vale zero nos pontos inteiros da grade', () => {
  const noise = createNoise2D(createRandom(5));
  assert.equal(noise(4, 9), 0);
  assert.equal(noise(-3, 2), 0);
});

test('noise permanece no intervalo [-1, 1] e varia no espaço', () => {
  const noise = createNoise2D(createRandom(3));
  const values = [];
  for (let i = 0; i < 2000; i++) {
    const value = noise(i * 0.137, i * 0.071);
    assert.ok(value >= -1 && value <= 1);
    values.push(value);
  }
  assert.ok(Math.max(...values) - Math.min(...values) > 0.5);
});

test('fractalNoise2D normaliza a soma das oitavas', () => {
  const constant = () => 0.5;
  assert.equal(fractalNoise2D(constant, 1, 1, 4), 0.5);
});
