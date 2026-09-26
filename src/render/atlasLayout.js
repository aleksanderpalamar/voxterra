const CHANNELS = 4;
const ALPHA = 3;
const SAMPLE_OFFSETS = Object.freeze([[0, 0], [1, 0], [0, 1], [1, 1]]);

function averageBlock(pixels, size, x, y) {
  const samples = SAMPLE_OFFSETS.map(([dx, dy]) => ((y * 2 + dy) * size + (x * 2 + dx)) * CHANNELS);
  const totalAlpha = samples.reduce((sum, index) => sum + pixels[index + ALPHA], 0);
  const weightOf = (index) => (totalAlpha === 0 ? 1 : pixels[index + ALPHA]);
  const totalWeight = samples.reduce((sum, index) => sum + weightOf(index), 0);
  const color = [0, 1, 2].map((channel) => {
    const weighted = samples.reduce((sum, index) => sum + pixels[index + channel] * weightOf(index), 0);
    return Math.round(weighted / totalWeight);
  });
  return [...color, Math.round(totalAlpha / samples.length)];
}

export function downsampleTile(pixels, size) {
  const half = size / 2;
  const result = new Uint8ClampedArray(half * half * CHANNELS);
  for (let y = 0; y < half; y++) {
    for (let x = 0; x < half; x++) {
      result.set(averageBlock(pixels, size, x, y), (y * half + x) * CHANNELS);
    }
  }
  return result;
}

export function composeAtlasLevel(tiles, tileSize) {
  const width = tileSize * tiles.length;
  const height = tileSize;
  const data = new Uint8Array(width * height * CHANNELS);
  tiles.forEach((pixels, tileIndex) => {
    for (let y = 0; y < tileSize; y++) {
      const sourceStart = y * tileSize * CHANNELS;
      const row = pixels.subarray(sourceStart, sourceStart + tileSize * CHANNELS);
      const targetRow = height - 1 - y;
      data.set(row, (targetRow * width + tileIndex * tileSize) * CHANNELS);
    }
  });
  return { data, width, height };
}

export function buildAtlasLevels(tiles, tileSize) {
  const levels = [];
  let current = tiles;
  for (let size = tileSize; size >= 1; size /= 2) {
    levels.push(composeAtlasLevel(current, size));
    if (size > 1) current = current.map((pixels) => downsampleTile(pixels, size));
  }
  return levels;
}
