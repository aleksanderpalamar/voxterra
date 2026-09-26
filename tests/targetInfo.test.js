import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TargetInfo } from '../src/hud/targetInfo.js';
import { BlockType } from '../src/world/blockTypes.js';

class FakeLabel {
  constructor() {
    this.calls = [];
  }

  show(blockType, name) {
    this.calls.push(['show', blockType, name]);
  }

  hide() {
    this.calls.push(['hide']);
  }
}

function setup(blocks) {
  const label = new FakeLabel();
  const blockAt = ({ x, y, z }) => blocks[`${x},${y},${z}`] ?? BlockType.AIR;
  return { label, info: new TargetInfo(label, blockAt) };
}

const targetAt = (x, y, z) => ({ position: { x, y, z }, normal: { x: 0, y: 1, z: 0 }, distance: 2 });

test('o rótulo começa oculto', () => {
  const { label } = setup({});
  assert.deepEqual(label.calls, [['hide']]);
});

test('mostra o nome do bloco sob a mira', () => {
  const { label, info } = setup({ '1,2,3': BlockType.ACACIA_WOOD });
  info.update(targetAt(1, 2, 3));
  assert.deepEqual(label.calls.at(-1), ['show', BlockType.ACACIA_WOOD, 'Acacia Wood']);
});

test('não redesenha enquanto o tipo de bloco mirado não muda', () => {
  const { label, info } = setup({ '0,0,0': BlockType.STONE, '1,0,0': BlockType.STONE, '2,0,0': BlockType.PINE_LEAVES });
  info.update(targetAt(0, 0, 0));
  info.update(targetAt(0, 0, 0));
  info.update(targetAt(1, 0, 0));
  info.update(targetAt(2, 0, 0));
  assert.deepEqual(label.calls, [
    ['hide'],
    ['show', BlockType.STONE, 'Stone'],
    ['show', BlockType.PINE_LEAVES, 'Pine Leaves'],
  ]);
});

test('esconde quando não há alvo e volta a mostrar ao mirar de novo', () => {
  const { label, info } = setup({ '0,0,0': BlockType.CACTUS });
  info.update(targetAt(0, 0, 0));
  info.update(null);
  info.update(null);
  info.update(targetAt(0, 0, 0));
  assert.deepEqual(label.calls, [
    ['hide'],
    ['show', BlockType.CACTUS, 'Cactus'],
    ['hide'],
    ['show', BlockType.CACTUS, 'Cactus'],
  ]);
});
