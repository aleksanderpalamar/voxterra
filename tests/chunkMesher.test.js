import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChunkMesh } from '../src/render/chunkMesher.js';
import { createTileUvLookup } from '../src/render/blockTiles.js';
import { BlockType } from '../src/world/blockTypes.js';
import { World } from '../src/world/world.js';
import { createOcclusionQuery } from '../src/world/worldQueries.js';

function meshWorld(world) {
  const source = { getBlock: (x, y, z) => world.getBlock(x, y, z), isOccluding: createOcclusionQuery(world) };
  const bounds = { minX: 0, minY: 0, minZ: 0, maxX: world.sizeX, maxY: world.sizeY, maxZ: world.sizeZ };
  return buildChunkMesh(source, bounds, createTileUvLookup());
}

const faceCount = (mesh) => mesh.indices.length / 6;

test('bloco isolado gera seis faces', () => {
  const world = new World(4, 4, 4);
  world.setBlock(1, 1, 1, BlockType.STONE);
  const mesh = meshWorld(world);
  assert.equal(faceCount(mesh), 6);
  assert.equal(mesh.positions.length, 6 * 4 * 3);
  assert.equal(mesh.uvs.length, 6 * 4 * 2);
});

test('faces entre blocos vizinhos são removidas', () => {
  const world = new World(4, 4, 4);
  world.setBlock(1, 1, 1, BlockType.STONE);
  world.setBlock(2, 1, 1, BlockType.DIRT);
  assert.equal(faceCount(meshWorld(world)), 10);
});

test('faces voltadas para baixo do mundo não são geradas', () => {
  const world = new World(4, 4, 4);
  world.setBlock(1, 0, 1, BlockType.STONE);
  assert.equal(faceCount(meshWorld(world)), 5);
});

test('mundo vazio não gera geometria', () => {
  assert.equal(faceCount(meshWorld(new World(4, 4, 4))), 0);
});

test('vértices recebem sombreamento de oclusão ambiente', () => {
  const world = new World(4, 4, 4);
  world.setBlock(1, 1, 1, BlockType.STONE);
  world.setBlock(2, 2, 1, BlockType.STONE);
  const colors = Array.from(meshWorld(world).colors);
  assert.ok(Math.min(...colors) < 1);
  assert.equal(Math.max(...colors), 1);
});
