import { NEUTRAL_TINT, TintKind, climateTint, tintKindOf } from './climateTint.js';

function sampleCorners(sampleClimate, bounds, width, depth) {
  const grids = { [TintKind.GRASS]: [], [TintKind.FOLIAGE]: [] };
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const climate = sampleClimate(bounds.minX + x, bounds.minZ + z);
      grids[TintKind.GRASS].push(climateTint(TintKind.GRASS, climate));
      grids[TintKind.FOLIAGE].push(climateTint(TintKind.FOLIAGE, climate));
    }
  }
  return grids;
}

export function createChunkTint(sampleClimate, bounds) {
  const width = bounds.maxX - bounds.minX + 1;
  const depth = bounds.maxZ - bounds.minZ + 1;
  const grids = sampleCorners(sampleClimate, bounds, width, depth);
  return (blockType, x, z) => {
    const kind = tintKindOf(blockType);
    if (kind === TintKind.NONE) return NEUTRAL_TINT;
    const localX = x - bounds.minX;
    const localZ = z - bounds.minZ;
    if (localX < 0 || localX >= width || localZ < 0 || localZ >= depth) return climateTint(kind, sampleClimate(x, z));
    return grids[kind][localZ * width + localX];
  };
}
