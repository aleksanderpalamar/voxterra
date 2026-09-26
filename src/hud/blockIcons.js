import { FaceDirection } from '../render/faceDefinitions.js';
import { tileFor } from '../render/blockTiles.js';

const ICON_SIZE = 48;

const ICON_FACES = Object.freeze([
  { direction: FaceDirection.TOP, matrix: [0.5, -0.25, 0.5, 0.25, 0, 0.25], shadow: 0 },
  { direction: FaceDirection.FRONT, matrix: [0.5, 0.25, 0, 0.5, 0, 0.25], shadow: 0.22 },
  { direction: FaceDirection.RIGHT, matrix: [0.5, -0.25, 0, 0.5, 0.5, 0.5], shadow: 0.4 },
]);

function createTileCanvas(document, pixels, tileSize) {
  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;
  canvas.getContext('2d').putImageData(new ImageData(pixels, tileSize, tileSize), 0, 0);
  return canvas;
}

function drawFace(context, tileCanvas, face, tileSize) {
  const [a, b, c, d, e, f] = face.matrix;
  const scale = ICON_SIZE / tileSize;
  context.setTransform(a * scale, b * scale, c * scale, d * scale, e * ICON_SIZE, f * ICON_SIZE);
  context.drawImage(tileCanvas, 0, 0);
  if (face.shadow === 0) return;
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = `rgba(0, 0, 0, ${face.shadow})`;
  context.fillRect(0, 0, tileSize, tileSize);
  context.globalCompositeOperation = 'source-over';
}

export function createBlockIconFactory(document, tilePixels, tileSize) {
  const tileCanvases = tilePixels.map((pixels) => createTileCanvas(document, pixels, tileSize));
  return (blockType) => {
    const canvas = document.createElement('canvas');
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    ICON_FACES.forEach((face) => {
      drawFace(context, tileCanvases[tileFor(blockType, face.direction)], face, tileSize);
    });
    return canvas;
  };
}
