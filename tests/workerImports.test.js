import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMPORT_PATTERN = /(?:^|\n)\s*import\s[^'"]*?from\s+['"]([^'"]+)['"]/g;

function collectImports(file, visited = new Map()) {
  if (visited.has(file)) return visited;
  const specifiers = [...readFileSync(file, 'utf8').matchAll(IMPORT_PATTERN)].map((match) => match[1]);
  visited.set(file, specifiers);
  specifiers
    .filter((specifier) => specifier.startsWith('.'))
    .forEach((specifier) => collectImports(resolve(dirname(file), specifier), visited));
  return visited;
}

test('o worker e suas dependências não importam three nem pacotes externos', () => {
  const graph = collectImports(resolve(ROOT, 'src/workers/chunkWorker.js'));
  assert.ok(graph.size > 5, 'grafo de imports suspeito de estar incompleto');
  graph.forEach((specifiers, file) => {
    specifiers.forEach((specifier) => {
      assert.ok(specifier.startsWith('.'), `${file} importa ${specifier}, indisponível dentro de workers`);
    });
  });
});
