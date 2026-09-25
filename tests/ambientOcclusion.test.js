import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cornerOcclusion, quadIndices, vertexOcclusion } from '../src/render/ambientOcclusion.js';
import { FACES, FaceDirection } from '../src/render/faceDefinitions.js';
import { solidSet } from './helpers.js';

const topFace = FACES.find((face) => face.direction === FaceDirection.TOP);

test('cornerOcclusion segue a regra clássica de AO voxel', () => {
  assert.equal(cornerOcclusion(false, false, false), 3);
  assert.equal(cornerOcclusion(false, false, true), 2);
  assert.equal(cornerOcclusion(true, false, true), 1);
  assert.equal(cornerOcclusion(true, true, false), 0);
});

test('vértice sem vizinhos fica totalmente iluminado', () => {
  const isOccluding = solidSet([[0, 0, 0]]);
  topFace.corners.forEach((corner) => {
    assert.equal(vertexOcclusion(isOccluding, 0, 0, 0, topFace, corner), 3);
  });
});

test('parede ao lado escurece apenas os vértices adjacentes', () => {
  const isOccluding = solidSet([[0, 0, 0], [1, 1, 0]]);
  const occlusion = topFace.corners.map((corner) => vertexOcclusion(isOccluding, 0, 0, 0, topFace, corner));
  topFace.corners.forEach((corner, index) => {
    const expected = corner.position[0] === 1 ? 2 : 3;
    assert.equal(occlusion[index], expected);
  });
});

test('quadIndices inverte a diagonal quando o par 0-3 é mais claro', () => {
  assert.deepEqual(quadIndices(0, [3, 3, 3, 3]), [0, 1, 2, 2, 1, 3]);
  assert.deepEqual(quadIndices(4, [3, 0, 0, 3]), [4, 5, 7, 4, 7, 6]);
});
