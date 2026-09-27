import { TILE_SIZE, jitter, shade } from './paintKit.js';

const KNOT_CHANCE = 0.1;

function wood({ bark, barkDark, ringLight, ringDark, grainBase = 0.8, grainRange = 0.28 }) {
  return Object.freeze({ bark, barkDark, ringLight, ringDark, grainBase, grainRange });
}

export const Wood = Object.freeze({
  OAK: wood({ bark: [106, 78, 48], barkDark: [72, 52, 32], ringLight: [188, 150, 98], ringDark: [152, 116, 72] }),
  SPRUCE: wood({ bark: [62, 44, 28], barkDark: [40, 28, 18], ringLight: [160, 110, 72], ringDark: [128, 84, 54] }),
  ACACIA: wood({ bark: [106, 102, 96], barkDark: [78, 74, 70], ringLight: [208, 114, 62], ringDark: [174, 90, 48] }),
  JUNGLE: wood({
    bark: [138, 106, 54],
    barkDark: [98, 74, 36],
    ringLight: [198, 148, 120],
    ringDark: [166, 118, 94],
    grainBase: 0.7,
    grainRange: 0.46,
  }),
});

export function barkPainter(palette) {
  return (random) => {
    const columns = Array.from({ length: TILE_SIZE }, () => palette.grainBase + random() * palette.grainRange);
    return (x) => {
      const base = random() < KNOT_CHANCE ? palette.barkDark : palette.bark;
      return jitter(shade(base, columns[x]), random, 0.05);
    };
  };
}

export function ringsPainter(palette) {
  return (random) => {
    const center = (TILE_SIZE - 1) / 2;
    return (x, y) => {
      const ring = Math.max(Math.abs(x - center), Math.abs(y - center));
      if (ring > center - 1) return jitter(palette.bark, random, 0.06);
      const color = Math.floor(ring / 2) % 2 === 0 ? palette.ringLight : palette.ringDark;
      return jitter(color, random, 0.04);
    };
  };
}
