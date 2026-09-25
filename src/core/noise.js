const TABLE_SIZE = 256;
const TABLE_MASK = TABLE_SIZE - 1;

const GRADIENTS = Object.freeze([
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
]);

function buildPermutation(random) {
  const values = Array.from({ length: TABLE_SIZE }, (_, index) => index);
  for (let i = TABLE_SIZE - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return Uint8Array.from([...values, ...values]);
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function gradientDot(permutation, ix, iy, dx, dy) {
  const hash = permutation[permutation[ix & TABLE_MASK] + (iy & TABLE_MASK)];
  const [gx, gy] = GRADIENTS[hash & 7];
  return gx * dx + gy * dy;
}

function perlin(permutation, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fade(fx);
  const v = fade(fy);
  const bottom = lerp(
    gradientDot(permutation, x0, y0, fx, fy),
    gradientDot(permutation, x0 + 1, y0, fx - 1, fy),
    u,
  );
  const top = lerp(
    gradientDot(permutation, x0, y0 + 1, fx, fy - 1),
    gradientDot(permutation, x0 + 1, y0 + 1, fx - 1, fy - 1),
    u,
  );
  return lerp(bottom, top, v);
}

export function createNoise2D(random) {
  const permutation = buildPermutation(random);
  return (x, y) => perlin(permutation, x, y);
}

export function fractalNoise2D(noise, x, y, octaves) {
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let normalization = 0;
  for (let octave = 0; octave < octaves; octave++) {
    total += noise(x * frequency, y * frequency) * amplitude;
    normalization += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / normalization;
}
