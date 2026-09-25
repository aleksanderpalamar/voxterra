export const AO_BRIGHTNESS = Object.freeze([0.45, 0.64, 0.82, 1]);

export function cornerOcclusion(side1, side2, diagonal) {
  if (side1 && side2) return 0;
  return 3 - (Number(side1) + Number(side2) + Number(diagonal));
}

function occludedAt(isOccluding, origin, axisU, offsetU, axisV, offsetV) {
  const point = [origin[0], origin[1], origin[2]];
  point[axisU] += offsetU;
  point[axisV] += offsetV;
  return isOccluding(point[0], point[1], point[2]);
}

export function vertexOcclusion(isOccluding, x, y, z, face, corner) {
  const front = [x + face.normal[0], y + face.normal[1], z + face.normal[2]];
  const [axisU, axisV] = face.tangents;
  const offsetU = corner.position[axisU] === 1 ? 1 : -1;
  const offsetV = corner.position[axisV] === 1 ? 1 : -1;
  const side1 = occludedAt(isOccluding, front, axisU, offsetU, axisV, 0);
  const side2 = occludedAt(isOccluding, front, axisU, 0, axisV, offsetV);
  const diagonal = occludedAt(isOccluding, front, axisU, offsetU, axisV, offsetV);
  return cornerOcclusion(side1, side2, diagonal);
}

export function quadIndices(baseIndex, occlusion) {
  if (occlusion[0] + occlusion[3] > occlusion[1] + occlusion[2]) {
    return [baseIndex, baseIndex + 1, baseIndex + 3, baseIndex, baseIndex + 3, baseIndex + 2];
  }
  return [baseIndex, baseIndex + 1, baseIndex + 2, baseIndex + 2, baseIndex + 1, baseIndex + 3];
}
