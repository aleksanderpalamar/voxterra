import { TILE_SIZE, TRANSPARENT, jitter, shade } from './paintKit.js';

const LEAF_HOLE_CHANCE = 0.22;

const Palette = Object.freeze({
  BARK: [106, 78, 48],
  BARK_DARK: [72, 52, 32],
  RING_LIGHT: [188, 150, 98],
  RING_DARK: [152, 116, 72],
  LEAVES: [58, 126, 46],
  LEAVES_DARK: [34, 86, 30],
  LEAVES_LIGHT: [88, 156, 62],
  PINE_NEEDLES: [42, 94, 66],
  PINE_NEEDLES_DARK: [26, 64, 46],
  PINE_NEEDLES_LIGHT: [62, 120, 84],
  CACTUS: [70, 138, 54],
  CACTUS_DARK: [48, 104, 40],
  CACTUS_SPINE: [214, 222, 176],
  CACTUS_CORE: [112, 170, 84],
});

export function barkPainter(random) {
  const columns = Array.from({ length: TILE_SIZE }, () => 0.8 + random() * 0.28);
  return (x) => {
    const base = random() < 0.1 ? Palette.BARK_DARK : Palette.BARK;
    return jitter(shade(base, columns[x]), random, 0.05);
  };
}

export function woodTopPainter(random) {
  const center = (TILE_SIZE - 1) / 2;
  return (x, y) => {
    const ring = Math.max(Math.abs(x - center), Math.abs(y - center));
    if (ring > center - 1) return jitter(Palette.BARK, random, 0.06);
    const color = Math.floor(ring / 2) % 2 === 0 ? Palette.RING_LIGHT : Palette.RING_DARK;
    return jitter(color, random, 0.04);
  };
}

function holedLeavesPainter(colors) {
  return (random) => () => {
    const roll = random();
    if (roll < LEAF_HOLE_CHANCE) return [...colors.dark, TRANSPARENT];
    if (roll < 0.4) return jitter(colors.dark, random, 0.1);
    if (roll < 0.52) return jitter(colors.light, random, 0.08);
    return jitter(colors.base, random, 0.12);
  };
}

export const leavesPainter = holedLeavesPainter({ base: Palette.LEAVES, dark: Palette.LEAVES_DARK, light: Palette.LEAVES_LIGHT });

export const pineLeavesPainter = holedLeavesPainter({
  base: Palette.PINE_NEEDLES,
  dark: Palette.PINE_NEEDLES_DARK,
  light: Palette.PINE_NEEDLES_LIGHT,
});

export function cactusSidePainter(random) {
  return (x, y) => {
    if (x % 4 === 0) return jitter(Palette.CACTUS_DARK, random, 0.05);
    if (x % 4 === 2 && y % 5 === 1) return jitter(Palette.CACTUS_SPINE, random, 0.03);
    return jitter(Palette.CACTUS, random, 0.06);
  };
}

export function cactusTopPainter(random) {
  const center = (TILE_SIZE - 1) / 2;
  return (x, y) => {
    const ring = Math.max(Math.abs(x - center), Math.abs(y - center));
    if (ring > center - 1) return jitter(Palette.CACTUS_DARK, random, 0.05);
    if (ring < 2) return jitter(Palette.CACTUS_CORE, random, 0.04);
    return jitter(Palette.CACTUS, random, 0.06);
  };
}
