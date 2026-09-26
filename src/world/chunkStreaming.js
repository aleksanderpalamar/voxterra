function distanceSquared(chunk, centerX, centerZ) {
  const dx = chunk.chunkX - centerX;
  const dz = chunk.chunkZ - centerZ;
  return dx * dx + dz * dz;
}

export function byDistanceFrom(centerX, centerZ) {
  return (a, b) => distanceSquared(a, centerX, centerZ) - distanceSquared(b, centerX, centerZ);
}

export function chunksWithinRadius(centerX, centerZ, radius) {
  const limit = radius * radius;
  const chunks = [];
  for (let dz = -radius; dz <= radius; dz++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dz * dz > limit) continue;
      chunks.push({ chunkX: centerX + dx, chunkZ: centerZ + dz });
    }
  }
  return chunks.sort(byDistanceFrom(centerX, centerZ));
}

export function chunksOutsideRadius(chunks, centerX, centerZ, radius) {
  const limit = radius * radius;
  return Array.from(chunks).filter((chunk) => distanceSquared(chunk, centerX, centerZ) > limit);
}
