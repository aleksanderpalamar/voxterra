const WORLD_UP = Object.freeze({ x: 0, y: 1, z: 0 });
const DEGENERATE_LENGTH = 1e-9;

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length < DEGENERATE_LENGTH) return null;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function snap(value, step) {
  return Math.round(value / step) * step;
}

export function lightSpaceBasis(direction) {
  const forward = normalize(direction);
  if (forward === null) return null;
  const right = normalize(cross(WORLD_UP, forward));
  if (right === null) return null;
  return Object.freeze({ right, up: cross(forward, right), forward });
}

export function snapToTexelGrid(point, basis, texelSize) {
  const u = snap(dot(point, basis.right), texelSize);
  const v = snap(dot(point, basis.up), texelSize);
  const w = dot(point, basis.forward);
  const { right, up, forward } = basis;
  return {
    x: right.x * u + up.x * v + forward.x * w,
    y: right.y * u + up.y * v + forward.y * w,
    z: right.z * u + up.z * v + forward.z * w,
  };
}
