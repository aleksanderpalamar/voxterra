function initialBoundaryDistance(origin, cell, direction) {
  if (direction > 0) return (cell + 1 - origin) / direction;
  if (direction < 0) return (origin - cell) / -direction;
  return Infinity;
}

function smallestAxis(values) {
  if (values[0] <= values[1] && values[0] <= values[2]) return 0;
  return values[1] <= values[2] ? 1 : 2;
}

function toVector(values) {
  return { x: values[0], y: values[1], z: values[2] };
}

export function raycastVoxels(origin, direction, maxDistance, isTarget) {
  const start = [origin.x, origin.y, origin.z];
  const dir = [direction.x, direction.y, direction.z];
  const cell = start.map(Math.floor);
  const step = dir.map(Math.sign);
  const tDelta = dir.map((value) => (value === 0 ? Infinity : Math.abs(1 / value)));
  const tMax = dir.map((value, axis) => initialBoundaryDistance(start[axis], cell[axis], value));
  const normal = [0, 0, 0];
  let distance = 0;

  while (distance <= maxDistance) {
    if (isTarget(cell[0], cell[1], cell[2])) {
      return { position: toVector(cell), normal: toVector(normal), distance };
    }
    const axis = smallestAxis(tMax);
    distance = tMax[axis];
    cell[axis] += step[axis];
    normal.fill(0);
    normal[axis] = -step[axis];
    tMax[axis] += tDelta[axis];
  }
  return null;
}
