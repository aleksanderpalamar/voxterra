import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom, hashCoordinates, randomInt } from '../src/core/random.js';

test('createRandom produz a mesma sequência para a mesma seed', () => {
  const a = createRandom(123);
  const b = createRandom(123);
  const sequenceA = Array.from({ length: 10 }, a);
  const sequenceB = Array.from({ length: 10 }, b);
  assert.deepEqual(sequenceA, sequenceB);
});

test('createRandom produz sequências diferentes para seeds diferentes', () => {
  const a = Array.from({ length: 5 }, createRandom(1));
  const b = Array.from({ length: 5 }, createRandom(2));
  assert.notDeepEqual(a, b);
});

test('createRandom gera valores no intervalo [0, 1)', () => {
  const random = createRandom(99);
  for (let i = 0; i < 1000; i++) {
    const value = random();
    assert.ok(value >= 0 && value < 1);
  }
});

test('randomInt respeita os limites inclusivos', () => {
  const random = createRandom(7);
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const value = randomInt(random, 2, 4);
    assert.ok(value >= 2 && value <= 4);
    seen.add(value);
  }
  assert.deepEqual([...seen].sort(), [2, 3, 4]);
});

test('hashCoordinates é determinístico e sensível a cada coordenada', () => {
  assert.equal(hashCoordinates(5, 10, -3), hashCoordinates(5, 10, -3));
  const hashes = new Set();
  for (let z = -4; z <= 4; z++) {
    for (let x = -4; x <= 4; x++) hashes.add(hashCoordinates(5, x, z));
  }
  assert.equal(hashes.size, 81);
  assert.notEqual(hashCoordinates(5, 1, 2), hashCoordinates(5, 2, 1));
  assert.notEqual(hashCoordinates(5, 1, 2), hashCoordinates(6, 1, 2));
});

test('hashCoordinates retorna um inteiro sem sinal de 32 bits', () => {
  const hash = hashCoordinates(123, -99999, 77777);
  assert.ok(Number.isInteger(hash) && hash >= 0 && hash < 2 ** 32);
});
