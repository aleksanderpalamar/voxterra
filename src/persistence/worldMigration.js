export const MigrationResult = Object.freeze({
  MIGRATED: 'migrated',
  NO_LEGACY_SAVE: 'no-legacy-save',
  TARGET_HAS_SAVE: 'target-has-save',
});

async function copyChunks(source, target) {
  for (const { chunkX, chunkZ } of source.chunkCoordinates()) {
    const blocks = await source.loadChunk(chunkX, chunkZ);
    if (blocks !== null) await target.saveChunk(chunkX, chunkZ, blocks);
  }
}

export async function migrateLegacyWorld({ target, openLegacy, deleteLegacy }) {
  if ((await target.loadMetadata()) !== null) return MigrationResult.TARGET_HAS_SAVE;
  const legacy = await openLegacy();
  if (legacy === null) return MigrationResult.NO_LEGACY_SAVE;
  const metadata = await legacy.loadMetadata();
  if (metadata !== null) {
    await copyChunks(legacy, target);
    await target.saveMetadata(metadata);
  }
  await deleteLegacy(legacy);
  return metadata === null ? MigrationResult.NO_LEGACY_SAVE : MigrationResult.MIGRATED;
}
