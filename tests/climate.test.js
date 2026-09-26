import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ClimateSampler } from '../src/world/climate.js';

function samples(sampler, step = 97, count = 60) {
  const values = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) values.push(sampler.sample(i * step - 2900, j * step - 2900));
  }
  return values;
}

function correlation(xs, ys) {
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const [mx, my] = [mean(xs), mean(ys)];
  const cov = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const sx = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0));
  const sy = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0));
  return cov / (sx * sy);
}

test('o clima é determinístico para a mesma seed e muda com outra seed', () => {
  assert.deepEqual(new ClimateSampler(9).sample(1234, -567), new ClimateSampler(9).sample(1234, -567));
  assert.notDeepEqual(new ClimateSampler(9).sample(1234, -567), new ClimateSampler(10).sample(1234, -567));
});

test('temperatura e umidade ficam no intervalo [-1, 1] e cobrem boa parte dele', () => {
  const values = samples(new ClimateSampler(3));
  ['temperature', 'humidity'].forEach((field) => {
    const series = values.map((value) => value[field]);
    assert.ok(series.every((value) => value >= -1 && value <= 1));
    assert.ok(Math.min(...series) < -0.5 && Math.max(...series) > 0.5, `${field} com pouca variação`);
  });
});

test('temperatura e umidade são campos independentes', () => {
  const values = samples(new ClimateSampler(21));
  const r = correlation(values.map((value) => value.temperature), values.map((value) => value.humidity));
  assert.ok(Math.abs(r) < 0.25, `correlação alta demais: ${r}`);
});

test('o clima varia suavemente entre colunas vizinhas', () => {
  const sampler = new ClimateSampler(5);
  for (let x = 0; x < 400; x += 7) {
    const here = sampler.sample(x, 50);
    const next = sampler.sample(x + 1, 50);
    assert.ok(Math.abs(here.temperature - next.temperature) < 0.05);
    assert.ok(Math.abs(here.humidity - next.humidity) < 0.05);
  }
});
