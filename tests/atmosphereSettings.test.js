import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atmosphereFor } from '../src/render/atmosphereSettings.js';
import { Medium } from '../src/world/blockTypes.js';

const air = Object.freeze({ color: 0xa9d3f5, near: 48, far: 128 });

test('no ar a atmosfera mantém a névoa, o céu e nenhum véu', () => {
  const settings = atmosphereFor(Medium.AIR, air);
  assert.equal(settings.fogColor, air.color);
  assert.equal(settings.background, air.color);
  assert.equal(settings.near, air.near);
  assert.equal(settings.far, air.far);
  assert.equal(settings.skyVisible, true);
  assert.equal(settings.tint, null);
});

test('debaixo da água a névoa fica azul, curta e o céu some', () => {
  const settings = atmosphereFor(Medium.WATER, air);
  const blue = settings.fogColor & 0xff;
  const red = (settings.fogColor >> 16) & 0xff;
  assert.ok(blue > red + 40);
  assert.ok(settings.far < air.far / 4);
  assert.ok(settings.near < settings.far);
  assert.equal(settings.background, settings.fogColor);
  assert.equal(settings.skyVisible, false);
  assert.ok(settings.tint.opacity > 0 && settings.tint.opacity < 0.5);
});
