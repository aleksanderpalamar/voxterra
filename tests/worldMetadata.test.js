import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METADATA_VERSION, createWorldMetadata, parseWorldMetadata } from '../src/persistence/worldMetadata.js';

const player = { x: 1.5, y: 30, z: -4.25, yaw: 0.5, pitch: -0.2 };

test('createWorldMetadata registra seed, jogador, versão e horário', () => {
  const metadata = createWorldMetadata(42, player, 1000);
  assert.deepEqual(metadata, { version: METADATA_VERSION, seed: 42, player, savedAt: 1000 });
});

test('parseWorldMetadata aceita metadados válidos', () => {
  const metadata = createWorldMetadata(42, player, 1000);
  assert.deepEqual(parseWorldMetadata(structuredClone(metadata)), metadata);
});

test('parseWorldMetadata rejeita dados ausentes, de outra versão ou corrompidos', () => {
  const valid = createWorldMetadata(42, player, 1000);
  [
    null,
    undefined,
    'texto',
    { ...valid, version: METADATA_VERSION + 1 },
    { ...valid, seed: 'abc' },
    { ...valid, player: null },
    { ...valid, player: { ...player, y: Number.NaN } },
  ].forEach((raw) => assert.equal(parseWorldMetadata(raw), null));
});
