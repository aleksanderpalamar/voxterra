import { createNoiseField } from './noiseField.js';

export const CLIMATE_SETTINGS = Object.freeze({
  temperature: { salt: 0x7e3a, scale: 1 / 520, octaves: 3, gain: 2.4, detailScale: 1 / 11, detailAmplitude: 0.1 },
  humidity: { salt: 0x4b1d, scale: 1 / 440, octaves: 3, gain: 2.4, detailScale: 1 / 11, detailAmplitude: 0.1 },
});

export class ClimateSampler {
  constructor(seed, settings = CLIMATE_SETTINGS) {
    this.temperatureAt = createNoiseField(seed, settings.temperature);
    this.humidityAt = createNoiseField(seed, settings.humidity);
  }

  sample(x, z) {
    return { temperature: this.temperatureAt(x, z), humidity: this.humidityAt(x, z) };
  }
}
