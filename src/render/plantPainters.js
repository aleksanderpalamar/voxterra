import { TILE_SIZE, TRANSPARENT, jitter } from './paintKit.js';

const LEAF_HOLE_CHANCE = 0.22;

const Palette = Object.freeze({
  OAK_LEAVES: [58, 126, 46],
  OAK_LEAVES_DARK: [34, 86, 30],
  OAK_LEAVES_LIGHT: [88, 156, 62],
  SPRUCE_NEEDLES: [42, 94, 66],
  SPRUCE_NEEDLES_DARK: [26, 64, 46],
  SPRUCE_NEEDLES_LIGHT: [62, 120, 84],
  ACACIA_LEAVES: [112, 130, 46],
  ACACIA_LEAVES_DARK: [80, 96, 32],
  ACACIA_LEAVES_LIGHT: [140, 158, 64],
  JUNGLE_LEAVES: [46, 152, 42],
  JUNGLE_LEAVES_DARK: [28, 110, 30],
  JUNGLE_LEAVES_LIGHT: [82, 186, 60],
  CACTUS: [70, 138, 54],
  CACTUS_DARK: [48, 104, 40],
  CACTUS_SPINE: [214, 222, 176],
  CACTUS_CORE: [112, 170, 84],
});

function holedLeavesPainter(colors) {
  return (random) => () => {
    const roll = random();
    if (roll < LEAF_HOLE_CHANCE) return [...colors.dark, TRANSPARENT];
    if (roll < 0.4) return jitter(colors.dark, random, 0.1);
    if (roll < 0.52) return jitter(colors.light, random, 0.08);
    return jitter(colors.base, random, 0.12);
  };
}

export const oakLeavesPainter = holedLeavesPainter({ base: Palette.OAK_LEAVES, dark: Palette.OAK_LEAVES_DARK, light: Palette.OAK_LEAVES_LIGHT });

export const spruceLeavesPainter = holedLeavesPainter({
  base: Palette.SPRUCE_NEEDLES,
  dark: Palette.SPRUCE_NEEDLES_DARK,
  light: Palette.SPRUCE_NEEDLES_LIGHT,
});

export const acaciaLeavesPainter = holedLeavesPainter({
  base: Palette.ACACIA_LEAVES,
  dark: Palette.ACACIA_LEAVES_DARK,
  light: Palette.ACACIA_LEAVES_LIGHT,
});

export const jungleLeavesPainter = holedLeavesPainter({
  base: Palette.JUNGLE_LEAVES,
  dark: Palette.JUNGLE_LEAVES_DARK,
  light: Palette.JUNGLE_LEAVES_LIGHT,
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
