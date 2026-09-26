import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/world.js';
import { BlockType } from '../src/world/blockTypes.js';
import {
  createCollisionQuery,
  createOcclusionQuery,
  createOpacityQuery,
  createRenderSource,
  createTargetQuery,
} from '../src/world/worldQueries.js';

test('setBlock e getBlock armazenam blocos dentro dos limites', () => {
  const world = new World(4, 4, 4);
  assert.equal(world.setBlock(1, 2, 3, BlockType.STONE), true);
  assert.equal(world.getBlock(1, 2, 3), BlockType.STONE);
});

test('posições fora do mundo retornam ar e não são alteradas', () => {
  const world = new World(4, 4, 4);
  assert.equal(world.setBlock(-1, 0, 0, BlockType.DIRT), false);
  assert.equal(world.getBlock(-1, 0, 0), BlockType.AIR);
  assert.equal(world.getBlock(0, 4, 0), BlockType.AIR);
});

test('listeners são notificados apenas quando o bloco muda', () => {
  const world = new World(4, 4, 4);
  const changes = [];
  world.onBlockChanged((...args) => changes.push(args));
  world.setBlock(1, 1, 1, BlockType.WOOD);
  world.setBlock(1, 1, 1, BlockType.WOOD);
  assert.deepEqual(changes, [[1, 1, 1, BlockType.WOOD]]);
});

test('findSurfaceY retorna o bloco sólido mais alto ou null', () => {
  const world = new World(4, 8, 4);
  world.setBlock(2, 0, 2, BlockType.STONE);
  world.setBlock(2, 5, 2, BlockType.LEAVES);
  assert.equal(world.findSurfaceY(2, 2), 5);
  assert.equal(world.findSurfaceY(0, 0), null);
});

test('consulta de colisão trata as bordas do mundo como paredes e o céu como livre', () => {
  const world = new World(4, 4, 4);
  const isSolid = createCollisionQuery(world);
  assert.equal(isSolid(-1, 1, 1), true);
  assert.equal(isSolid(1, -1, 1), true);
  assert.equal(isSolid(1, 10, 1), false);
  assert.equal(isSolid(1, 1, 1), false);
});

test('consulta de oclusão oculta apenas faces abaixo do chão do mundo', () => {
  const world = new World(4, 4, 4);
  const isOccluding = createOcclusionQuery(world);
  assert.equal(isOccluding(1, -1, 1), true);
  assert.equal(isOccluding(-1, 1, 1), false);
});

test('consulta de alvo considera apenas blocos sólidos existentes', () => {
  const world = new World(4, 4, 4);
  world.setBlock(1, 1, 1, BlockType.GRASS);
  const isTarget = createTargetQuery(world);
  assert.equal(isTarget(1, 1, 1), true);
  assert.equal(isTarget(-1, 1, 1), false);
});

test('consulta de opacidade deixa ver através das folhas', () => {
  const world = new World(4, 4, 4);
  world.setBlock(1, 1, 1, BlockType.LEAVES);
  world.setBlock(2, 1, 1, BlockType.STONE);
  const isOpaque = createOpacityQuery(world);
  assert.equal(isOpaque(1, 1, 1), false);
  assert.equal(isOpaque(2, 1, 1), true);
  assert.equal(isOpaque(1, -1, 1), true);
});

test('createRenderSource agrupa as consultas usadas pelo mesher', () => {
  const world = new World(4, 4, 4);
  world.setBlock(1, 1, 1, BlockType.LEAVES);
  const source = createRenderSource(world);
  assert.equal(source.getBlock(1, 1, 1), BlockType.LEAVES);
  assert.equal(source.isOpaque(1, 1, 1), false);
  assert.equal(source.isOccluding(1, 1, 1), true);
});
