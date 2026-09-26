import { createRandom, hashCoordinates } from '../core/random.js';
import { createNoise2D, fractalNoise2D } from '../core/noise.js';

const DETAIL_OFFSET = 311.7;

export function createNoiseField(seed, settings) {
  const noise = createNoise2D(createRandom(hashCoordinates(seed, settings.salt, 0)));
  return (x, z) => {
    const broad = fractalNoise2D(noise, x * settings.scale, z * settings.scale, settings.octaves) * settings.gain;
    const detail = noise(x * settings.detailScale + DETAIL_OFFSET, z * settings.detailScale - DETAIL_OFFSET);
    return Math.min(Math.max(broad + detail * settings.detailAmplitude, -1), 1);
  };
}
