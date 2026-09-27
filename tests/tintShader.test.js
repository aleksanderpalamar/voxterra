import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enableClimateTint } from '../src/render/tintShader.js';

const VERTEX = '#include <common>\nvoid main() {\n#include <begin_vertex>\n}';
const FRAGMENT = '#include <common>\nvoid main() {\n#include <map_fragment>\n#include <color_fragment>\n}';

test('o shader recebe o atributo de tonalidade e o aplica depois da cor do vértice', () => {
  const material = enableClimateTint({});
  const shader = { vertexShader: VERTEX, fragmentShader: FRAGMENT };
  material.onBeforeCompile(shader);
  assert.match(shader.vertexShader, /attribute vec3 tint;/);
  assert.match(shader.vertexShader, /#include <begin_vertex>\s*vTint = tint;/);
  assert.match(shader.fragmentShader, /varying vec3 vTint;/);
  assert.ok(shader.fragmentShader.lastIndexOf('vTint') > shader.fragmentShader.indexOf('#include <color_fragment>'));
});

test('um shader sem os pontos de injeção gera erro em vez de ignorar a tonalidade', () => {
  const material = enableClimateTint({});
  assert.throws(() => material.onBeforeCompile({ vertexShader: 'void main() {}', fragmentShader: FRAGMENT }), /begin_vertex|common/);
});
