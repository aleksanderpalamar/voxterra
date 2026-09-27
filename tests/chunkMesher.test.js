import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChunkMesh } from '../src/render/chunkMesher.js';
import { createTileUvLookup } from '../src/render/blockTiles.js';
import { BlockType } from '../src/world/blockTypes.js';
import { WATER_SURFACE_HEIGHT } from '../src/world/fluids.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';
import { createRenderSource } from '../src/world/worldQueries.js';
import { createEmptyWorld } from './helpers.js';

function meshWorld(world) {
  const source = createRenderSource(world);
  const bounds = { minX: 0, minY: 0, minZ: 0, maxX: CHUNK_SIZE, maxY: world.height, maxZ: CHUNK_SIZE };
  return buildChunkMesh(createRenderSource(world), bounds, createTileUvLookup());
}

const faceCount = (mesh) => mesh.solid.indices.length / 6;
const waterFaces = (mesh) => mesh.water.indices.length / 6;
const maxY = (data) => Math.max(...data.positions.filter((_, index) => index % 3 === 1));

test('bloco isolado gera seis faces', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.STONE);
  const mesh = meshWorld(world);
  assert.equal(faceCount(mesh), 6);
  assert.equal(mesh.solid.positions.length, 6 * 4 * 3);
  assert.equal(mesh.solid.uvs.length, 6 * 4 * 2);
});

test('faces entre blocos vizinhos são removidas', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.STONE);
  world.setBlock(2, 1, 1, BlockType.DIRT);
  assert.equal(faceCount(meshWorld(world)), 10);
});

test('faces voltadas para baixo do mundo não são geradas', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 0, 1, BlockType.STONE);
  assert.equal(faceCount(meshWorld(world)), 5);
});

test('mundo vazio não gera geometria', () => {
  assert.equal(faceCount(meshWorld(createEmptyWorld({ height: 4 }))), 0);
});

test('vértices recebem sombreamento de oclusão ambiente', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.STONE);
  world.setBlock(2, 2, 1, BlockType.STONE);
  const colors = Array.from(meshWorld(world).solid.colors);
  assert.ok(Math.min(...colors) < 1);
  assert.equal(Math.max(...colors), 1);
});

test('faces entre folhas vizinhas são mantidas para ver através dos furos', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.OAK_LEAVES);
  world.setBlock(2, 1, 1, BlockType.OAK_LEAVES);
  assert.equal(faceCount(meshWorld(world)), 12);
});

test('bloco opaco encostado em folhas mantém sua face e oculta a da folha', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.OAK_WOOD);
  world.setBlock(2, 1, 1, BlockType.OAK_LEAVES);
  assert.equal(faceCount(meshWorld(world)), 11);
});

test('bloco de água isolado gera seis faces na malha da água e nenhuma sólida', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.WATER);
  const mesh = meshWorld(world);
  assert.equal(waterFaces(mesh), 6);
  assert.equal(faceCount(mesh), 0);
  assert.ok(Math.abs(maxY(mesh.water) - (1 + WATER_SURFACE_HEIGHT)) < 1e-6);
});

test('faces entre blocos de água somem e só o topo da coluna é rebaixado', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.WATER);
  world.setBlock(1, 2, 1, BlockType.WATER);
  const mesh = meshWorld(world);
  assert.equal(waterFaces(mesh), 10);
  assert.ok(Math.abs(maxY(mesh.water) - (2 + WATER_SURFACE_HEIGHT)) < 1e-6);
});

test('água encostada em pedra esconde a própria face e mostra a da pedra', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.WATER);
  world.setBlock(2, 1, 1, BlockType.STONE);
  const mesh = meshWorld(world);
  assert.equal(waterFaces(mesh), 5);
  assert.equal(faceCount(mesh), 6);
});

const vertexTriples = (array) => Array.from({ length: array.length / 3 }, (_, index) => Array.from(array.slice(index * 3, index * 3 + 3)));

test('grama recebe a tonalidade de cada canto e os demais blocos ficam neutros', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.GRASS);
  world.setBlock(5, 1, 5, BlockType.STONE);
  world.setBlock(9, 1, 9, BlockType.WATER);
  const tintAt = (type, x, z) => (type === BlockType.GRASS ? [x / 8, 1, z / 8] : [1, 1, 1]);
  const bounds = { minX: 0, minY: 0, minZ: 0, maxX: CHUNK_SIZE, maxY: world.height, maxZ: CHUNK_SIZE };
  const mesh = buildChunkMesh(createRenderSource(world), bounds, createTileUvLookup(), tintAt);
  const positions = vertexTriples(mesh.solid.positions);
  const tints = vertexTriples(mesh.solid.tints);
  assert.equal(tints.length, positions.length);
  positions.forEach(([x, , z], index) => {
    const expected = x <= 2 ? [x / 8, 1, z / 8] : [1, 1, 1];
    assert.deepEqual(tints[index], expected.map(Math.fround));
  });
  assert.ok(mesh.water.tints.length > 0 && mesh.water.tints.every((channel) => channel === 1));
});

test('sem tonalidade informada todos os vértices ficam neutros', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.GRASS);
  world.setBlock(2, 1, 1, BlockType.OAK_LEAVES);
  assert.ok(meshWorld(world).solid.tints.every((channel) => channel === 1));
});
