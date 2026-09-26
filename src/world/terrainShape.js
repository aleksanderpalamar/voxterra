import { createRandom } from '../core/random.js';
import { createNoise2D, fractalNoise2D } from '../core/noise.js';
import { createNoiseField } from './noiseField.js';

export const SEA_LEVEL = 24;

export const TERRAIN_SHAPE = Object.freeze({
  continentalness: { salt: 0x2c07, scale: 1 / 900, octaves: 4, gain: 2.1, detailScale: 1 / 45, detailAmplitude: 0.02 },
  baseSpline: Object.freeze([[-1, 8], [-0.45, 13], [-0.2, 19], [-0.06, 23], [0, 26], [0.4, 30], [1, 34]]),
  inlandStart: -0.15,
  inlandFull: 0.15,
  coastalHillShare: 0.3,
  hillScale: 0.022,
  hillAmplitude: 16,
  hillOctaves: 4,
  mountainScale: 0.008,
  mountainAmplitude: 140,
  mountainOffset: 173.31,
});

export function continentalBase(continentalness, spline = TERRAIN_SHAPE.baseSpline) {
  const upper = spline.findIndex(([position]) => position >= continentalness);
  if (upper <= 0) return upper === 0 ? spline[0][1] : spline[spline.length - 1][1];
  const [x0, y0] = spline[upper - 1];
  const [x1, y1] = spline[upper];
  return y0 + ((continentalness - x0) / (x1 - x0)) * (y1 - y0);
}

export function inlandFactor(continentalness, shape = TERRAIN_SHAPE) {
  const t = (continentalness - shape.inlandStart) / (shape.inlandFull - shape.inlandStart);
  const clamped = Math.min(Math.max(t, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export class TerrainShaper {
  constructor(seed, maxHeight, shape = TERRAIN_SHAPE) {
    this.shape = shape;
    this.maxHeight = maxHeight;
    this.noise = createNoise2D(createRandom(seed));
    this.continentalnessAt = createNoiseField(seed, shape.continentalness);
  }

  heightAt(x, z, continentalness = this.continentalnessAt(x, z)) {
    const { shape, noise } = this;
    const inland = inlandFactor(continentalness, shape);
    const hills = fractalNoise2D(noise, x * shape.hillScale, z * shape.hillScale, shape.hillOctaves);
    const mountainX = x * shape.mountainScale + shape.mountainOffset;
    const mountainZ = z * shape.mountainScale - shape.mountainOffset;
    const ridge = Math.max(0, fractalNoise2D(noise, mountainX, mountainZ, 2));
    const hillWeight = shape.coastalHillShare + (1 - shape.coastalHillShare) * inland;
    const height = continentalBase(continentalness, shape.baseSpline)
      + hills * shape.hillAmplitude * hillWeight
      + ridge * ridge * shape.mountainAmplitude * inland;
    return Math.min(Math.max(Math.round(height), 1), this.maxHeight);
  }
}
