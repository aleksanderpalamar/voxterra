import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Hotbar } from '../src/hotbar/hotbar.js';
import { BlockType, PLACEABLE_BLOCKS } from '../src/world/blockTypes.js';

test('hotbar começa com o primeiro bloco selecionado', () => {
  const hotbar = new Hotbar(PLACEABLE_BLOCKS);
  assert.equal(hotbar.selectedBlock, BlockType.GRASS);
  assert.equal(hotbar.size, 5);
});

test('select aceita índices válidos e notifica ouvintes', () => {
  const hotbar = new Hotbar(PLACEABLE_BLOCKS);
  const events = [];
  hotbar.onChange((index, block) => events.push([index, block]));
  assert.equal(hotbar.select(2), true);
  assert.equal(hotbar.selectedBlock, BlockType.STONE);
  assert.deepEqual(events, [[2, BlockType.STONE]]);
});

test('select ignora índices inválidos', () => {
  const hotbar = new Hotbar(PLACEABLE_BLOCKS);
  assert.equal(hotbar.select(9), false);
  assert.equal(hotbar.select(-1), false);
  assert.equal(hotbar.selectedIndex, 0);
});

test('cycle percorre a hotbar de forma circular', () => {
  const hotbar = new Hotbar(PLACEABLE_BLOCKS);
  hotbar.cycle(-1);
  assert.equal(hotbar.selectedBlock, BlockType.PERSISTENT_LEAVES);
  hotbar.cycle(1);
  assert.equal(hotbar.selectedBlock, BlockType.GRASS);
});
