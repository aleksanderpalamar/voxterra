import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE } from '../src/world/chunkLayout.js';
import {
  createCollisionQuery,
  createMeshSource,
  createOcclusionQuery,
  createOpacityQuery,
  createRenderSource,
  createTargetQuery,
} from '../src/world/worldQueries.js';
import { createEmptyWorld } from './helpers.js';

test('consulta de colisão trata chunks não carregados como parede e o céu como livre', () => {
  const world = createEmptyWorld({ height: 4 });
  const isSolid = createCollisionQuery(world);
  assert.equal(isSolid(-1, 1, 1), true);
  assert.equal(isSolid(CHUNK_SIZE, 1, 1), true);
  assert.equal(isSolid(1, -1, 1), true);
  assert.equal(isSolid(1, 10, 1), false);
  assert.equal(isSolid(1, 1, 1), false);
});

test('consulta de oclusão oculta apenas faces abaixo do chão do mundo', () => {
  const world = createEmptyWorld({ height: 4 });
  const isOccluding = createOcclusionQuery(world);
  assert.equal(isOccluding(1, -1, 1), true);
  assert.equal(isOccluding(-1, 1, 1), false);
});

test('consulta de alvo considera apenas blocos sólidos existentes', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.GRASS);
  const isTarget = createTargetQuery(world);
  assert.equal(isTarget(1, 1, 1), true);
  assert.equal(isTarget(-1, 1, 1), false);
});

test('consulta de opacidade deixa ver através das folhas', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.OAK_LEAVES);
  world.setBlock(2, 1, 1, BlockType.STONE);
  const isOpaque = createOpacityQuery(world);
  assert.equal(isOpaque(1, 1, 1), false);
  assert.equal(isOpaque(2, 1, 1), true);
  assert.equal(isOpaque(1, -1, 1), true);
});

test('createRenderSource agrupa as consultas usadas pelo mesher', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.OAK_LEAVES);
  const source = createRenderSource(world);
  assert.equal(source.getBlock(1, 1, 1), BlockType.OAK_LEAVES);
  assert.equal(source.isOpaque(1, 1, 1), false);
  assert.equal(source.isOccluding(1, 1, 1), true);
  assert.equal(source.isChunkMeshable(0, 0), false);
});

test('isChunkMeshable exige a vizinhança completa carregada', () => {
  const chunks = [];
  for (let chunkZ = -1; chunkZ <= 1; chunkZ++) {
    for (let chunkX = -1; chunkX <= 1; chunkX++) chunks.push([chunkX, chunkZ]);
  }
  const source = createRenderSource(createEmptyWorld({ height: 4, chunks }));
  assert.equal(source.isChunkMeshable(0, 0), true);
  assert.equal(source.isChunkMeshable(1, 1), false);
});

test('createMeshSource funciona com qualquer leitor de blocos', () => {
  const reader = { getBlock: (x, y, z) => (x === 0 && y === 0 && z === 0 ? BlockType.OAK_LEAVES : BlockType.AIR) };
  const source = createMeshSource(reader);
  assert.equal(source.getBlock(0, 0, 0), BlockType.OAK_LEAVES);
  assert.equal(source.isOpaque(0, 0, 0), false);
  assert.equal(source.isOccluding(0, 0, 0), true);
  assert.equal(source.isOccluding(0, -1, 0), true);
});

test('água não bloqueia colisão nem a mira', () => {
  const world = createEmptyWorld({ height: 4 });
  world.setBlock(1, 1, 1, BlockType.WATER);
  assert.equal(createCollisionQuery(world)(1, 1, 1), false);
  assert.equal(createTargetQuery(world)(1, 1, 1), false);
  assert.equal(createOpacityQuery(world)(1, 1, 1), false);
  assert.equal(createOcclusionQuery(world)(1, 1, 1), false);
});
