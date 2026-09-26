export const METADATA_VERSION = 1;

const PLAYER_FIELDS = Object.freeze(['x', 'y', 'z', 'yaw', 'pitch']);

function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

function parsePlayer(raw) {
  if (!isRecord(raw)) return null;
  if (!PLAYER_FIELDS.every((field) => Number.isFinite(raw[field]))) return null;
  return Object.fromEntries(PLAYER_FIELDS.map((field) => [field, raw[field]]));
}

export function createWorldMetadata(seed, player, savedAt = Date.now()) {
  return { version: METADATA_VERSION, seed, player, savedAt };
}

export function parseWorldMetadata(raw) {
  if (!isRecord(raw) || raw.version !== METADATA_VERSION) return null;
  if (!Number.isInteger(raw.seed)) return null;
  const player = parsePlayer(raw.player);
  if (player === null) return null;
  return { version: METADATA_VERSION, seed: raw.seed, player, savedAt: raw.savedAt };
}
