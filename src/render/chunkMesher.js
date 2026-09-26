import { isSolidBlock } from '../world/blockTypes.js';
import { FACES } from './faceDefinitions.js';
import { AO_BRIGHTNESS, quadIndices, vertexOcclusion } from './ambientOcclusion.js';

function createBuffers() {
  return { positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

function appendFace(buffers, source, face, x, y, z, uvRect) {
  const baseIndex = buffers.positions.length / 3;
  const occlusion = face.corners.map((corner) => vertexOcclusion(source.isOccluding, x, y, z, face, corner));
  face.corners.forEach((corner, cornerIndex) => {
    const [cx, cy, cz] = corner.position;
    const shade = AO_BRIGHTNESS[occlusion[cornerIndex]];
    buffers.positions.push(x + cx, y + cy, z + cz);
    buffers.normals.push(face.normal[0], face.normal[1], face.normal[2]);
    buffers.uvs.push(lerp(uvRect.u0, uvRect.u1, corner.uv[0]), lerp(uvRect.v0, uvRect.v1, corner.uv[1]));
    buffers.colors.push(shade, shade, shade);
  });
  buffers.indices.push(...quadIndices(baseIndex, occlusion));
}

function appendVisibleFaces(buffers, source, blockType, x, y, z, tileUv) {
  for (const face of FACES) {
    const [nx, ny, nz] = face.normal;
    if (source.isOpaque(x + nx, y + ny, z + nz)) continue;
    appendFace(buffers, source, face, x, y, z, tileUv(blockType, face.direction));
  }
}

function toTypedArrays(buffers) {
  return {
    positions: new Float32Array(buffers.positions),
    normals: new Float32Array(buffers.normals),
    uvs: new Float32Array(buffers.uvs),
    colors: new Float32Array(buffers.colors),
    indices: new Uint32Array(buffers.indices),
  };
}

export function buildChunkMesh(source, bounds, tileUv) {
  const buffers = createBuffers();
  for (let y = bounds.minY; y < bounds.maxY; y++) {
    for (let z = bounds.minZ; z < bounds.maxZ; z++) {
      for (let x = bounds.minX; x < bounds.maxX; x++) {
        const blockType = source.getBlock(x, y, z);
        if (!isSolidBlock(blockType)) continue;
        appendVisibleFaces(buffers, source, blockType, x, y, z, tileUv);
      }
    }
  }
  return toTypedArrays(buffers);
}
