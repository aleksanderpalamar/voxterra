import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEA_LEVEL, TerrainShaper, continentalBase, inlandFactor } from '../src/world/terrainShape.js';

test('a base continental sobe do fundo do oceano até o interior', () => {
  let previous = -Infinity;
  for (let c = -1; c <= 1; c += 0.05) {
    const base = continentalBase(c);
    assert.ok(base >= previous, `base não monotônica em ${c}`);
    previous = base;
  }
  assert.ok(continentalBase(-1) < SEA_LEVEL - 8);
  assert.ok(continentalBase(1) > SEA_LEVEL + 4);
});

test('o fator de interior vai de 0 no oceano a 1 no continente', () => {
  assert.equal(inlandFactor(-1), 0);
  assert.equal(inlandFactor(1), 1);
  const middle = inlandFactor(0);
  assert.ok(middle > 0 && middle < 1);
});

test('continentalidade é determinística, limitada e muda com a seed', () => {
  const shaper = new TerrainShaper(8, 54);
  assert.equal(shaper.continentalnessAt(900, -300), new TerrainShaper(8, 54).continentalnessAt(900, -300));
  assert.notEqual(shaper.continentalnessAt(900, -300), new TerrainShaper(9, 54).continentalnessAt(900, -300));
  for (let x = -5000; x < 5000; x += 250) {
    const value = shaper.continentalnessAt(x, x * 0.7);
    assert.ok(value >= -1 && value <= 1);
  }
});

test('a altura respeita os limites e muda suavemente entre colunas', () => {
  const shaper = new TerrainShaper(4, 54);
  for (let x = -600; x < 600; x += 3) {
    const here = shaper.heightAt(x, 40);
    assert.ok(Number.isInteger(here) && here >= 1 && here <= 54);
    assert.ok(Math.abs(here - shaper.heightAt(x + 1, 40)) <= 4);
  }
});

test('há oceanos e continentes numa região grande', () => {
  const shaper = new TerrainShaper(4, 54);
  let underwater = 0;
  let total = 0;
  for (let z = -6000; z < 6000; z += 150) {
    for (let x = -6000; x < 6000; x += 150) {
      if (shaper.heightAt(x, z) < SEA_LEVEL) underwater += 1;
      total += 1;
    }
  }
  const share = underwater / total;
  assert.ok(share > 0.2 && share < 0.55, `água cobre ${(share * 100).toFixed(1)}%`);
});
