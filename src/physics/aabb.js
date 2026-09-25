export function bodyBox(position, dimensions) {
  const halfWidth = dimensions.width / 2;
  return {
    minX: position.x - halfWidth,
    minY: position.y,
    minZ: position.z - halfWidth,
    maxX: position.x + halfWidth,
    maxY: position.y + dimensions.height,
    maxZ: position.z + halfWidth,
  };
}

export function blockBox(x, y, z) {
  return { minX: x, minY: y, minZ: z, maxX: x + 1, maxY: y + 1, maxZ: z + 1 };
}

export function boxesOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX
    && a.minY < b.maxY && a.maxY > b.minY
    && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function anyCellInBox(box, predicate) {
  const maxX = Math.ceil(box.maxX) - 1;
  const maxY = Math.ceil(box.maxY) - 1;
  const maxZ = Math.ceil(box.maxZ) - 1;
  for (let y = Math.floor(box.minY); y <= maxY; y++) {
    for (let z = Math.floor(box.minZ); z <= maxZ; z++) {
      for (let x = Math.floor(box.minX); x <= maxX; x++) {
        if (predicate(x, y, z)) return true;
      }
    }
  }
  return false;
}
