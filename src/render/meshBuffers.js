export function createMeshBuffers() {
  return { positions: [], normals: [], uvs: [], colors: [], tints: [], indices: [] };
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

export function pushVertex(buffers, position, normal, uv, uvRect, shade, tint) {
  buffers.positions.push(position[0], position[1], position[2]);
  buffers.normals.push(normal[0], normal[1], normal[2]);
  buffers.uvs.push(lerp(uvRect.u0, uvRect.u1, uv[0]), lerp(uvRect.v0, uvRect.v1, uv[1]));
  buffers.colors.push(shade, shade, shade);
  buffers.tints.push(tint[0], tint[1], tint[2]);
}

export function toMeshData(buffers) {
  return {
    positions: new Float32Array(buffers.positions),
    normals: new Float32Array(buffers.normals),
    uvs: new Float32Array(buffers.uvs),
    colors: new Float32Array(buffers.colors),
    tints: new Float32Array(buffers.tints),
    indices: new Uint32Array(buffers.indices),
  };
}

export function meshDataArrays(meshData) {
  return [meshData.positions, meshData.normals, meshData.uvs, meshData.colors, meshData.tints, meshData.indices];
}
