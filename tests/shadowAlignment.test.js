import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lightSpaceBasis, snapToTexelGrid } from '../src/render/shadowAlignment.js';

const SUN_DIRECTION = { x: 0.45, y: 0.82, z: 0.35 };
const TEXEL_SIZE = 96 / 2048;
const EPSILON = 1e-9;

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const isMultipleOf = (value, step) => Math.abs(value / step - Math.round(value / step)) < 1e-6;

test('lightSpaceBasis gera uma base ortonormal com eixo lateral horizontal', () => {
  const basis = lightSpaceBasis(SUN_DIRECTION);
  const { right, up, forward } = basis;
  [right, up, forward].forEach((axis) => assert.ok(Math.abs(dot(axis, axis) - 1) < EPSILON));
  assert.ok(Math.abs(dot(right, up)) < EPSILON);
  assert.ok(Math.abs(dot(right, forward)) < EPSILON);
  assert.ok(Math.abs(dot(up, forward)) < EPSILON);
  assert.ok(Math.abs(right.y) < EPSILON);
  assert.ok(up.y > 0);
});

test('lightSpaceBasis retorna null para direção vertical', () => {
  assert.equal(lightSpaceBasis({ x: 0, y: 1, z: 0 }), null);
});

test('snapToTexelGrid alinha a posição à grade de texels no espaço da luz', () => {
  const basis = lightSpaceBasis(SUN_DIRECTION);
  const snapped = snapToTexelGrid({ x: 80.37, y: 24.9, z: 77.12 }, basis, TEXEL_SIZE);
  assert.ok(isMultipleOf(dot(snapped, basis.right), TEXEL_SIZE));
  assert.ok(isMultipleOf(dot(snapped, basis.up), TEXEL_SIZE));
});

test('snapToTexelGrid preserva a profundidade e desloca no máximo meio texel', () => {
  const basis = lightSpaceBasis(SUN_DIRECTION);
  const point = { x: 12.3, y: 40.01, z: -7.77 };
  const snapped = snapToTexelGrid(point, basis, TEXEL_SIZE);
  const offset = { x: snapped.x - point.x, y: snapped.y - point.y, z: snapped.z - point.z };
  assert.ok(Math.abs(dot(offset, basis.forward)) < 1e-9);
  assert.ok(Math.abs(dot(offset, basis.right)) <= TEXEL_SIZE / 2 + EPSILON);
  assert.ok(Math.abs(dot(offset, basis.up)) <= TEXEL_SIZE / 2 + EPSILON);
});

test('pequenos movimentos dentro do mesmo texel não movem a câmera de sombra', () => {
  const basis = lightSpaceBasis(SUN_DIRECTION);
  const center = snapToTexelGrid({ x: 50, y: 20, z: 50 }, basis, TEXEL_SIZE);
  const nudge = TEXEL_SIZE * 0.2;
  const moved = {
    x: center.x + basis.right.x * nudge,
    y: center.y + basis.right.y * nudge,
    z: center.z + basis.right.z * nudge,
  };
  const snapped = snapToTexelGrid(moved, basis, TEXEL_SIZE);
  assert.ok(Math.abs(dot(snapped, basis.right) - dot(center, basis.right)) < 1e-9);
  assert.ok(Math.abs(dot(snapped, basis.up) - dot(center, basis.up)) < 1e-9);
});
