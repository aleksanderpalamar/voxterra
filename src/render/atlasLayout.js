const CHANNELS = 4;

export function downsampleTile(pixels, size) {
  const half = size / 2;
  const result = new Uint8ClampedArray(half * half * CHANNELS);
  for (let y = 0; y < half; y++) {
    for (let x = 0; x < half; x++) {
      for (let channel = 0; channel < CHANNELS; channel++) {
        const sample = (dx, dy) => pixels[((y * 2 + dy) * size + (x * 2 + dx)) * CHANNELS + channel];
        const average = (sample(0, 0) + sample(1, 0) + sample(0, 1) + sample(1, 1)) / 4;
        result[(y * half + x) * CHANNELS + channel] = Math.round(average);
      }
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
