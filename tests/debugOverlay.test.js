import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DebugOverlay, formatDebugLines } from '../src/hud/debugOverlay.js';
import { Biome } from '../src/world/biomes.js';

const column = { biome: Biome.TAIGA, climate: { temperature: -0.3456, humidity: 0.1 } };

test('formatDebugLines mostra posição, chunk, bioma e clima', () => {
  const lines = formatDebugLines({ x: -17.25, y: 30, z: 5.5 }, column);
  assert.deepEqual(lines, [
    'XYZ: -17.3 / 30.0 / 5.5',
    'Chunk: -2, 0',
    'Bioma: Taiga',
    'Temperatura: -0.35',
    'Umidade: 0.10',
  ]);
});

class FakePanel {
  constructor() {
    this.visible = false;
    this.lines = null;
  }

  setVisible(visible) {
    this.visible = visible;
  }

  render(lines) {
    this.lines = lines;
  }
}

test('o painel começa oculto e só é atualizado quando visível', () => {
  const panel = new FakePanel();
  let lookups = 0;
  const overlay = new DebugOverlay(panel, () => {
    lookups += 1;
    return column;
  });
  overlay.update({ x: 0, y: 0, z: 0 });
  assert.equal(panel.visible, false);
  assert.equal(lookups, 0);
  overlay.toggle();
  overlay.update({ x: 0, y: 0, z: 0 });
  assert.equal(panel.visible, true);
  assert.equal(lookups, 1);
  assert.equal(panel.lines[2], 'Bioma: Taiga');
  overlay.toggle();
  assert.equal(panel.visible, false);
});

test('a coluna consultada é a que está sob o jogador', () => {
  const asked = [];
  const overlay = new DebugOverlay(new FakePanel(), (x, z) => {
    asked.push([x, z]);
    return column;
  });
  overlay.toggle();
  overlay.update({ x: -0.5, y: 10, z: 3.9 });
  assert.deepEqual(asked, [[-1, 3]]);
});
