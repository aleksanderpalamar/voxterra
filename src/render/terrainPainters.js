import { TILE_SIZE, jitter, shade } from './paintKit.js';

const Palette = Object.freeze({
  GRASS: [98, 164, 60],
  GRASS_LIGHT: [130, 192, 78],
  GRASS_DARK: [74, 132, 46],
  DIRT: [136, 98, 68],
  DIRT_DARK: [100, 70, 48],
  DIRT_LIGHT: [162, 122, 88],
  STONE: [130, 130, 134],
  STONE_DARK: [100, 100, 106],
  STONE_LIGHT: [160, 160, 164],
  SAND: [222, 206, 150],
  SAND_DARK: [196, 176, 120],
  SAND_LIGHT: [238, 226, 180],
  SNOW: [242, 246, 250],
  SNOW_SHADE: [220, 230, 242],
  WATER: [40, 88, 178],
  WATER_LIGHT: [66, 118, 204],
  WATER_DARK: [32, 72, 156],
  ICE: [176, 210, 242],
  ICE_LIGHT: [222, 238, 252],
  ICE_DARK: [150, 188, 228],
});

export function grassTopPainter(random) {
  return () => {
    const roll = random();
    if (roll < 0.12) return jitter(Palette.GRASS_LIGHT, random, 0.06);
    if (roll < 0.24) return jitter(Palette.GRASS_DARK, random, 0.06);
    return jitter(Palette.GRASS, random, 0.08);
  };
}

export function dirtPainter(random) {
  return () => {
    const roll = random();
    if (roll < 0.14) return jitter(Palette.DIRT_DARK, random, 0.08);
    if (roll < 0.21) return jitter(Palette.DIRT_LIGHT, random, 0.08);
    return jitter(Palette.DIRT, random, 0.1);
  };
}

export function grassSidePainter(random) {
  const fringe = Array.from({ length: TILE_SIZE }, () => 2 + Math.floor(random() * 3));
  const grass = grassTopPainter(random);
  const dirt = dirtPainter(random);
  return (x, y) => {
    if (y < fringe[x]) return grass(x, y);
    if (y === fringe[x]) return shade(dirt(x, y), 0.78);
    return dirt(x, y);
  };
}

export function stonePainter(random) {
  const clusterSize = TILE_SIZE / 2;
  const clusters = Array.from({ length: clusterSize * clusterSize }, () => 0.9 + random() * 0.18);
  return (x, y) => {
    const cluster = clusters[(y >> 1) * clusterSize + (x >> 1)];
    const roll = random();
    if (roll < 0.1) return jitter(shade(Palette.STONE_DARK, cluster), random, 0.05);
    if (roll < 0.17) return jitter(shade(Palette.STONE_LIGHT, cluster), random, 0.05);
    return jitter(shade(Palette.STONE, cluster), random, 0.06);
  };
}

export function sandPainter(random) {
  return () => {
    const roll = random();
    if (roll < 0.14) return jitter(Palette.SAND_DARK, random, 0.04);
    if (roll < 0.24) return jitter(Palette.SAND_LIGHT, random, 0.03);
    return jitter(Palette.SAND, random, 0.04);
  };
}

export function snowPainter(random) {
  return () => {
    if (random() < 0.16) return jitter(Palette.SNOW_SHADE, random, 0.02);
    return jitter(Palette.SNOW, random, 0.015);
  };
}

export function waterPainter(random) {
  const rows = Array.from({ length: TILE_SIZE }, () => random());
  return (x, y) => {
    const ripple = Math.sin((x + rows[y] * 6) * 0.9 + y * 0.4);
    if (ripple > 0.82) return jitter(Palette.WATER_LIGHT, random, 0.03);
    if (ripple < -0.85) return jitter(Palette.WATER_DARK, random, 0.03);
    return jitter(Palette.WATER, random, 0.04);
  };
}

export function icePainter(random) {
  const crack = Array.from({ length: TILE_SIZE }, () => Math.floor(random() * TILE_SIZE));
  return (x, y) => {
    if (crack[x] === y) return jitter(Palette.ICE_LIGHT, random, 0.02);
    if (random() < 0.12) return jitter(Palette.ICE_DARK, random, 0.02);
    return jitter(Palette.ICE, random, 0.03);
  };
}
