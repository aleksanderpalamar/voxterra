import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLOUD_SETTINGS, cloudCells, cloudTileOrigin } from '../src/render/cloudField.js';

test('cloudTileOrigin mantém a câmera coberta pelo mosaico 2x2', () => {
  const span = 320;
  [-5000, -161, -1, 0, 159.9, 160, 777, 12345.6].forEach((camera) => {
    [0, 17.5, 319].forEach((offset) => {
      const origin = cloudTileOrigin(camera, offset, span);
      assert.ok(origin <= camera - span / 2, `origem ${origin} além da câmera ${camera}`);
      assert.ok(origin + span * 2 >= camera + span / 2);
      const phase = (((origin - offset) % span) + span) % span;
      assert.ok(phase < 1e-6 || span - phase < 1e-6);
    });
  });
});

test('cloudCells é determinístico e fica dentro da grade', () => {
  const cells = cloudCells(42);
  assert.deepEqual(cells, cloudCells(42));
  assert.ok(cells.length > 0);
  cells.forEach(({ x, z }) => {
    assert.ok(x >= 0 && x < CLOUD_SETTINGS.cellsPerSide && z >= 0 && z < CLOUD_SETTINGS.cellsPerSide);
  });
});
