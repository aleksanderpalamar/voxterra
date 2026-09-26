import { Medium, mediumOf } from './blockTypes.js';

export const WATER_SURFACE_HEIGHT = 0.875;

export function mediumAt(getBlock, x, y, z) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const cellZ = Math.floor(z);
  const medium = mediumOf(getBlock(cellX, cellY, cellZ));
  if (medium === Medium.AIR) return Medium.AIR;
  if (mediumOf(getBlock(cellX, cellY + 1, cellZ)) === medium) return medium;
  return y - cellY < WATER_SURFACE_HEIGHT ? medium : Medium.AIR;
}
