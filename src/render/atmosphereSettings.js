import { Medium } from '../world/blockTypes.js';

const UNDERWATER = Object.freeze({
  fogColor: 0x1b4f7c,
  near: 0.5,
  far: 22,
  tint: Object.freeze({ color: 0x1f5f9e, opacity: 0.28 }),
});

export function atmosphereFor(medium, air) {
  if (medium === Medium.WATER) {
    return { ...UNDERWATER, background: UNDERWATER.fogColor, skyVisible: false };
  }
  return { fogColor: air.color, background: air.color, near: air.near, far: air.far, skyVisible: true, tint: null };
}
