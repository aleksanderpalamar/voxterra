import { RenderLayer, renderLayerOf } from '../world/blockTypes.js';
import { WATER_SURFACE_HEIGHT } from '../world/fluids.js';
import { FACES } from './faceDefinitions.js';
import { pushVertex } from './meshBuffers.js';

const FULL_BRIGHTNESS = 1;
const DEFAULT_QUAD = Object.freeze([0, 1, 2, 2, 1, 3]);

function isWaterAt(source, x, y, z) {
  return renderLayerOf(source.getBlock(x, y, z)) === RenderLayer.WATER;
}

function showsFace(source, x, y, z) {
  return !isWaterAt(source, x, y, z) && !source.isOpaque(x, y, z);
}

function appendFace(buffers, face, x, y, z, surfaceHeight, uvRect) {
  const baseIndex = buffers.positions.length / 3;
  face.corners.forEach((corner) => {
    const [cx, cy, cz] = corner.position;
    const top = cy === 1 ? surfaceHeight : cy;
    pushVertex(buffers, [x + cx, y + top, z + cz], face.normal, corner.uv, uvRect, FULL_BRIGHTNESS);
  });
  buffers.indices.push(...DEFAULT_QUAD.map((offset) => baseIndex + offset));
}

export function appendWaterFaces(buffers, source, blockType, x, y, z, tileUv) {
  const surfaceHeight = isWaterAt(source, x, y + 1, z) ? 1 : WATER_SURFACE_HEIGHT;
  for (const face of FACES) {
    const [nx, ny, nz] = face.normal;
    if (!showsFace(source, x + nx, y + ny, z + nz)) continue;
    appendFace(buffers, face, x, y, z, surfaceHeight, tileUv(blockType, face.direction));
  }
}
