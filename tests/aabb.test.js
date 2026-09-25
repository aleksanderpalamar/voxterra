import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anyCellInBox, blockBox, bodyBox, boxesOverlap } from '../src/physics/aabb.js';

test('bodyBox centraliza a largura e parte dos pés', () => {
  const box = bodyBox({ x: 5, y: 2, z: 5 }, { width: 0.6, height: 1.8 });
  assert.deepEqual(box, { minX: 4.7, minY: 2, minZ: 4.7, maxX: 5.3, maxY: 3.8, maxZ: 5.3 });
});

test('boxesOverlap não considera caixas apenas encostadas', () => {
  assert.equal(boxesOverlap(blockBox(0, 0, 0), blockBox(1, 0, 0)), false);
  assert.equal(boxesOverlap(blockBox(0, 0, 0), bodyBox({ x: 1, y: 0.5, z: 0.5 }, { width: 0.6, height: 1 })), true);
});

test('anyCellInBox percorre apenas as células ocupadas pela caixa', () => {
  const visited = [];
  anyCellInBox({ minX: 0.5, minY: 0, minZ: 0.5, maxX: 1.5, maxY: 1, maxZ: 0.9 }, (x, y, z) => {
    visited.push([x, y, z]);
    return false;
  });
  assert.deepEqual(visited, [[0, 0, 0], [1, 0, 0]]);
});
