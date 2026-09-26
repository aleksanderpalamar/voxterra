import { createRandom, hashCoordinates } from '../core/random.js';
import { createNoise2D, fractalNoise2D } from '../core/noise.js';

const DETAIL_OFFSET = 311.7;

export const CLIMATE_SETTINGS = Object.freeze({
  temperature: { salt: 0x7e3a, scale: 1 / 520, octaves: 3, gain: 2.4, detailScale: 1 / 11, detailAmplitude: 0.1 },
  humidity: { salt: 0x4b1d, scale: 1 / 440, octaves: 3, gain: 2.4, detailScale: 1 / 11, detailAmplitude: 0.1 },
});

function createField(seed, settings) {
  const noise = createNoise2D(createRandom(hashCoordinates(seed, settings.salt, 0)));
  return (x, z) => {
    const broad = fractalNoise2D(noise, x * settings.scale, z * settings.scale, settings.octaves) * settings.gain;
    const detail = noise(x * settings.detailScale + DETAIL_OFFSET, z * settings.detailScale - DETAIL_OFFSET);
    return Math.min(Math.max(broad + detail * settings.detailAmplitude, -1), 1);
  };
}

export class ClimateSampler {
  constructor(seed, settings = CLIMATE_SETTINGS) {
    this.temperatureAt = createField(seed, settings.temperature);
    this.humidityAt = createField(seed, settings.humidity);
  }

  sample(x, z) {
    return { temperature: this.temperatureAt(x, z), humidity: this.humidityAt(x, z) };
  }
}
