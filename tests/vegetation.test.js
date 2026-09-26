import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Biome } from '../src/world/biomes.js';
import { BlockType } from '../src/world/blockTypes.js';
import { MAX_CROWN_REACH, SPECIES_TRAITS, Species, canGrowOn, chooseSpecies, heightFor, vegetationFor } from '../src/world/vegetation.js';

test('todo bioma tem um perfil de flora válido', () => {
  Object.values(Biome).forEach((biome) => {
    const profile = vegetationFor(biome);
    assert.ok(profile.density >= 0 && profile.density <= 1, biome);
    profile.species.forEach(({ species, weight }) => {
      assert.ok(SPECIES_TRAITS[species], `${biome}: espécie ${species} desconhecida`);
      assert.ok(weight > 0);
    });
  });
});

test('as densidades seguem o caráter de cada bioma', () => {
  const density = (biome) => vegetationFor(biome).density;
  assert.equal(density(Biome.OCEAN), 0);
  assert.equal(density(Biome.BEACH), 0);
  assert.ok(density(Biome.RAINFOREST) > density(Biome.FOREST));
  assert.ok(density(Biome.FOREST) > density(Biome.SAVANNA));
  assert.ok(density(Biome.SAVANNA) > density(Biome.PLAINS));
  assert.ok(density(Biome.TAIGA) > density(Biome.TUNDRA));
});

test('cada bioma usa as espécies esperadas', () => {
  const species = (biome) => vegetationFor(biome).species.map((entry) => entry.species);
  assert.deepEqual(species(Biome.DESERT), [Species.CACTUS]);
  assert.ok(species(Biome.TAIGA).includes(Species.CONIFER));
  assert.ok(species(Biome.SAVANNA).includes(Species.ACACIA));
  assert.ok(species(Biome.RAINFOREST).includes(Species.JUNGLE));
  assert.ok(species(Biome.FOREST).includes(Species.OAK));
});

test('chooseSpecies respeita os pesos pelo sorteio', () => {
  const profile = vegetationFor(Biome.RAINFOREST);
  const counts = new Map();
  for (let i = 0; i < 1000; i++) {
    const species = chooseSpecies(profile, (i + 0.5) / 1000);
    counts.set(species, (counts.get(species) ?? 0) + 1);
  }
  const total = profile.species.reduce((sum, entry) => sum + entry.weight, 0);
  profile.species.forEach(({ species, weight }) => {
    assert.ok(Math.abs(counts.get(species) / 1000 - weight / total) < 0.01, species);
  });
});

test('cada espécie só cresce no chão adequado', () => {
  assert.equal(canGrowOn(Species.CACTUS, BlockType.SAND), true);
  assert.equal(canGrowOn(Species.CACTUS, BlockType.GRASS), false);
  assert.equal(canGrowOn(Species.OAK, BlockType.GRASS), true);
  assert.equal(canGrowOn(Species.OAK, BlockType.SAND), false);
  assert.equal(canGrowOn(Species.CONIFER, BlockType.SNOW), true);
});

test('heightFor fica dentro da faixa de cada espécie', () => {
  Object.values(Species).forEach((species) => {
    const { minHeight, maxHeight } = SPECIES_TRAITS[species];
    assert.equal(heightFor(species, 0), minHeight);
    assert.equal(heightFor(species, 0.999), maxHeight);
  });
  assert.ok(MAX_CROWN_REACH >= Math.max(...Object.values(SPECIES_TRAITS).map((traits) => traits.crownReach)));
});
