import { test } from 'node:test';
import assert from 'node:assert/strict';
import { raycastVoxels } from '../src/interaction/voxelRaycast.js';
import { solidSet } from './helpers.js';

test('raycast encontra o bloco à frente com a normal da face atingida', () => {
  const isSolid = solidSet([[5, 0, 0]]);
  const hit = raycastVoxels({ x: 0.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 10, isSolid);
  assert.deepEqual(hit.position, { x: 5, y: 0, z: 0 });
  assert.deepEqual(hit.normal, { x: -1, y: 0, z: 0 });
  assert.ok(Math.abs(hit.distance - 4.5) < 1e-9);
});

test('raycast olhando para baixo atinge a face superior', () => {
  const isSolid = solidSet([[2, 1, 2]]);
  const hit = raycastVoxels({ x: 2.5, y: 3.6, z: 2.5 }, { x: 0, y: -1, z: 0 }, 6, isSolid);
  assert.deepEqual(hit.position, { x: 2, y: 1, z: 2 });
  assert.deepEqual(hit.normal, { x: 0, y: 1, z: 0 });
});

test('raycast retorna null quando o bloco está além do alcance', () => {
  const isSolid = solidSet([[9, 0, 0]]);
  assert.equal(raycastVoxels({ x: 0.5, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }, 6, isSolid), null);
});

test('raycast funciona em direções negativas e diagonais', () => {
  const isSolid = solidSet([[-3, 0, -3]]);
  const direction = { x: -Math.SQRT1_2, y: 0, z: -Math.SQRT1_2 };
  const hit = raycastVoxels({ x: 0.5, y: 0.5, z: 0.5 }, direction, 10, isSolid);
  assert.deepEqual(hit.position, { x: -3, y: 0, z: -3 });
  assert.equal(Math.abs(hit.normal.x) + Math.abs(hit.normal.z), 1);
});
