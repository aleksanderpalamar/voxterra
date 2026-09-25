import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACES } from '../src/render/faceDefinitions.js';

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function triangleNormal(corners, [i, j, k]) {
  const [a, b, c] = [corners[i].position, corners[j].position, corners[k].position];
  return cross(subtract(b, a), subtract(c, a)).map((value) => value + 0);
}

test('existem seis faces com normais distintas', () => {
  const normals = new Set(FACES.map((face) => face.normal.join(',')));
  assert.equal(normals.size, 6);
});

test('todos os vértices de cada face ficam no plano da normal', () => {
  FACES.forEach((face) => {
    const axis = face.normal.findIndex((value) => value !== 0);
    const expected = face.normal[axis] > 0 ? 1 : 0;
    face.corners.forEach((corner) => assert.equal(corner.position[axis], expected));
  });
});

test('as duas triangulações possíveis apontam para fora do cubo', () => {
  const triangulations = [[0, 1, 2], [2, 1, 3], [0, 1, 3], [0, 3, 2]];
  FACES.forEach((face) => {
    triangulations.forEach((triangle) => {
      assert.deepEqual(triangleNormal(face.corners, triangle), face.normal);
    });
  });
});
