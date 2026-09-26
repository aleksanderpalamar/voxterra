import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');

function buttonMarkup(id) {
  const match = html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>([\\s\\S]*?)</button>`));
  return match === null ? null : { tag: match[0], content: match[1] };
}

test('o menu exibe o botão de multiplayer desabilitado com a etiqueta Em breve', () => {
  const button = buttonMarkup('multiplayer-button');
  assert.notEqual(button, null, 'botão de multiplayer ausente');
  assert.match(button.tag, /\sdisabled[\s>]/);
  assert.match(button.tag, /aria-disabled="true"/);
  assert.match(button.content, /Multiplayer/);
  assert.match(button.content, /Em breve/);
});
