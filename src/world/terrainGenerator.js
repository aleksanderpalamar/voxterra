import { BlockType } from './blockTypes.js';
import { fractalNoise2D } from '../core/noise.js';

export const TERRAIN_SETTINGS = Object.freeze({
  baseHeight: 20,
  hillScale: 0.022,
  hillAmplitude: 20,
  hillOctaves: 4,
  mountainScale: 0.008,
  mountainAmplitude: 140,
  mountainOffset: 173.31,
});

export function sampleSurfaceHeight(noise, x, z, settings = TERRAIN_SETTINGS) {
  const hills = fractalNoise2D(noise, x * settings.hillScale, z * settings.hillScale, settings.hillOctaves);
  const mountainX = x * settings.mountainScale + settings.mountainOffset;
  const mountainZ = z * settings.mountainScale - settings.mountainOffset;
  const ridge = Math.max(0, fractalNoise2D(noise, mountainX, mountainZ, 2));
  return settings.baseHeight + hills * settings.hillAmplitude + ridge * ridge * settings.mountainAmplitude;
}

export function surfaceHeight(noise, x, z, maxHeight, settings = TERRAIN_SETTINGS) {
  const height = Math.round(sampleSurfaceHeight(noise, x, z, settings));
  return Math.min(Math.max(height, 1), maxHeight);
}

export function columnBlockAt(y, surfaceY, surface) {
  if (y > surfaceY) return BlockType.AIR;
  if (y === surfaceY) return surface.top;
  if (y >= surfaceY - surface.fillerDepth) return surface.filler;
  return BlockType.STONE;
}

export function fillColumn(target, x, z, surfaceY, surface) {
  for (let y = 0; y <= surfaceY; y++) {
    target.setBlock(x, y, z, columnBlockAt(y, surfaceY, surface));
  }
}
