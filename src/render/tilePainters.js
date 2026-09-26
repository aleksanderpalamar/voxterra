import { createRandom } from '../core/random.js';
import { Tile, TILE_COUNT } from './blockTiles.js';

export const TILE_SIZE = 16;

const DEFAULT_TEXTURE_SEED = 1971;
const OPAQUE = 255;
const TRANSPARENT = 0;
const LEAF_HOLE_CHANCE = 0.22;

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
  BARK: [106, 78, 48],
  BARK_DARK: [72, 52, 32],
  RING_LIGHT: [188, 150, 98],
  RING_DARK: [152, 116, 72],
  LEAVES: [58, 126, 46],
  LEAVES_DARK: [34, 86, 30],
  LEAVES_LIGHT: [88, 156, 62],
});

function shade(color, factor) {
  return [color[0] * factor, color[1] * factor, color[2] * factor];
}

function jitter(color, random, amount) {
  return shade(color, 1 - amount + random() * amount * 2);
}

function grassTopPainter(random) {
  return () => {
    const roll = random();
    if (roll < 0.12) return jitter(Palette.GRASS_LIGHT, random, 0.06);
    if (roll < 0.24) return jitter(Palette.GRASS_DARK, random, 0.06);
    return jitter(Palette.GRASS, random, 0.08);
  };
}

function dirtPainter(random) {
  return () => {
    const roll = random();
    if (roll < 0.14) return jitter(Palette.DIRT_DARK, random, 0.08);
    if (roll < 0.21) return jitter(Palette.DIRT_LIGHT, random, 0.08);
    return jitter(Palette.DIRT, random, 0.1);
  };
}

function grassSidePainter(random) {
  const fringe = Array.from({ length: TILE_SIZE }, () => 2 + Math.floor(random() * 3));
  const grass = grassTopPainter(random);
  const dirt = dirtPainter(random);
  return (x, y) => {
    if (y < fringe[x]) return grass(x, y);
    if (y === fringe[x]) return shade(dirt(x, y), 0.78);
    return dirt(x, y);
  };
}

function stonePainter(random) {
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

function barkPainter(random) {
  const columns = Array.from({ length: TILE_SIZE }, () => 0.8 + random() * 0.28);
  return (x) => {
    const base = random() < 0.1 ? Palette.BARK_DARK : Palette.BARK;
    return jitter(shade(base, columns[x]), random, 0.05);
  };
}

function woodTopPainter(random) {
  const center = (TILE_SIZE - 1) / 2;
  return (x, y) => {
    const ring = Math.max(Math.abs(x - center), Math.abs(y - center));
    if (ring > center - 1) return jitter(Palette.BARK, random, 0.06);
    const color = Math.floor(ring / 2) % 2 === 0 ? Palette.RING_LIGHT : Palette.RING_DARK;
    return jitter(color, random, 0.04);
  };
}

function leavesPainter(random) {
  return () => {
    const roll = random();
    if (roll < LEAF_HOLE_CHANCE) return [...Palette.LEAVES_DARK, TRANSPARENT];
    if (roll < 0.4) return jitter(Palette.LEAVES_DARK, random, 0.1);
    if (roll < 0.52) return jitter(Palette.LEAVES_LIGHT, random, 0.08);
    return jitter(Palette.LEAVES, random, 0.12);
  };
}

const TILE_PAINTERS = Object.freeze({
  [Tile.GRASS_TOP]: grassTopPainter,
  [Tile.GRASS_SIDE]: grassSidePainter,
  [Tile.DIRT]: dirtPainter,
  [Tile.STONE]: stonePainter,
  [Tile.WOOD_SIDE]: barkPainter,
  [Tile.WOOD_TOP]: woodTopPainter,
  [Tile.LEAVES]: leavesPainter,
});

export function paintTile(tile, seed = DEFAULT_TEXTURE_SEED) {
  const createPainter = TILE_PAINTERS[tile];
  if (!createPainter) return null;
  const pixelAt = createPainter(createRandom(seed + tile * 7919));
  const pixels = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const [red, green, blue, alpha = OPAQUE] = pixelAt(x, y);
      pixels.set([red, green, blue, alpha], (y * TILE_SIZE + x) * 4);
    }
  }
  return pixels;
}

export function paintAllTiles(seed = DEFAULT_TEXTURE_SEED) {
  return Array.from({ length: TILE_COUNT }, (_, tile) => paintTile(tile, seed));
}
