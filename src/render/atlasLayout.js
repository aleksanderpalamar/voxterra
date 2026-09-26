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

export function padTile(pixels, tileSize) {
  const gutter = tileSize / 2;
  const cellSize = tileSize * 2;
  const cell = new Uint8ClampedArray(cellSize * cellSize * CHANNELS);
  const clamp = (value) => Math.min(Math.max(value - gutter, 0), tileSize - 1);
  for (let y = 0; y < cellSize; y++) {
    for (let x = 0; x < cellSize; x++) {
      const source = (clamp(y) * tileSize + clamp(x)) * CHANNELS;
      cell.set(pixels.subarray(source, source + CHANNELS), (y * cellSize + x) * CHANNELS);
    }
  }
  return cell;
}

export function composeAtlasLevel(cells, cellSize) {
  const width = cellSize * cells.length;
  const height = cellSize;
  const data = new Uint8Array(width * height * CHANNELS);
  cells.forEach((pixels, cellIndex) => {
    for (let y = 0; y < cellSize; y++) {
      const sourceStart = y * cellSize * CHANNELS;
      const row = pixels.subarray(sourceStart, sourceStart + cellSize * CHANNELS);
      data.set(row, ((height - 1 - y) * width + cellIndex * cellSize) * CHANNELS);
    }
  });
  return { data, width, height };
}

export function buildAtlasLevels(tiles, tileSize) {
  const levels = [];
  let cells = tiles.map((pixels) => padTile(pixels, tileSize));
  for (let size = tileSize * 2; size >= 1; size /= 2) {
    levels.push(composeAtlasLevel(cells, size));
    if (size > 1) cells = cells.map((pixels) => downsampleTile(pixels, size));
  }
  return levels;
}

export function tileUvRect(tile, tileCount) {
  const cellWidth = 1 / tileCount;
  return Object.freeze({
    u0: (tile + 0.25) * cellWidth,
    u1: (tile + 0.75) * cellWidth,
    v0: 0.25,
    v1: 0.75,
  });
}
