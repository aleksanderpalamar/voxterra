export const TILE_SIZE = 16;
export const OPAQUE = 255;
export const TRANSPARENT = 0;

export function shade(color, factor) {
  return [color[0] * factor, color[1] * factor, color[2] * factor];
}

export function jitter(color, random, amount) {
  return shade(color, 1 - amount + random() * amount * 2);
}
