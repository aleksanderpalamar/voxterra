import { RenderLayer, renderLayerOf } from '../world/blockTypes.js';
import { FACES } from './faceDefinitions.js';
import { AO_BRIGHTNESS, quadIndices, vertexOcclusion } from './ambientOcclusion.js';
import { createMeshBuffers, pushVertex, toMeshData } from './meshBuffers.js';
import { appendWaterFaces } from './waterMesher.js';

function appendSolidFace(buffers, source, face, x, y, z, uvRect) {
  const baseIndex = buffers.positions.length / 3;
  const occlusion = face.corners.map((corner) => vertexOcclusion(source.isOccluding, x, y, z, face, corner));
  face.corners.forEach((corner, cornerIndex) => {
    const [cx, cy, cz] = corner.position;
    pushVertex(buffers, [x + cx, y + cy, z + cz], face.normal, corner.uv, uvRect, AO_BRIGHTNESS[occlusion[cornerIndex]]);
  });
  buffers.indices.push(...quadIndices(baseIndex, occlusion));
}

function appendSolidFaces(buffers, source, blockType, x, y, z, tileUv) {
  for (const face of FACES) {
    const [nx, ny, nz] = face.normal;
    if (source.isOpaque(x + nx, y + ny, z + nz)) continue;
    appendSolidFace(buffers, source, face, x, y, z, tileUv(blockType, face.direction));
  }
}

export function buildChunkMesh(source, bounds, tileUv) {
  const solid = createMeshBuffers();
  const water = createMeshBuffers();
  for (let y = bounds.minY; y < bounds.maxY; y++) {
    for (let z = bounds.minZ; z < bounds.maxZ; z++) {
      for (let x = bounds.minX; x < bounds.maxX; x++) {
        const blockType = source.getBlock(x, y, z);
        const layer = renderLayerOf(blockType);
        if (layer === RenderLayer.SOLID) appendSolidFaces(solid, source, blockType, x, y, z, tileUv);
        else if (layer === RenderLayer.WATER) appendWaterFaces(water, source, blockType, x, y, z, tileUv);
      }
    }
  }
  return { solid: toMeshData(solid), water: toMeshData(water) };
}
