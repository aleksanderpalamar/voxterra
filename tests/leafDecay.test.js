import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { LEAF_DECAY, LeafDecay } from '../src/world/leafDecay.js';
import { findUnsupportedLeaves, isLeafSupported } from '../src/world/leafSupport.js';
import { placePlant } from '../src/world/treeShapes.js';
import { Species } from '../src/world/vegetation.js';
import { createEmptyWorld } from './helpers.js';

const NEIGHBORHOOD = [];
for (let chunkZ = -1; chunkZ <= 1; chunkZ++) {
  for (let chunkX = -1; chunkX <= 1; chunkX++) NEIGHBORHOOD.push([chunkX, chunkZ]);
}

const createWorld = () => createEmptyWorld({ height: 32, chunks: NEIGHBORHOOD });

function countLeaves(world, type = BlockType.LEAVES) {
  let count = 0;
  for (let y = 0; y < 32; y++) {
    for (let z = -10; z <= 10; z++) {
      for (let x = -10; x <= 10; x++) if (world.getBlock(x, y, z) === type) count += 1;
    }
  }
  return count;
}

function growOak(world, x = 0, z = 0) {
  world.setBlock(x, 2, z, BlockType.GRASS);
  placePlant(world, { species: Species.OAK, x, z, groundY: 2, height: 5, variant: 0 });
}

function breakTrunk(world, x = 0, z = 0) {
  for (let y = 3; y <= 7; y++) world.setBlock(x, y, z, BlockType.AIR);
}

const run = (decay, seconds) => {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) decay.update(0.05);
};

test('folha encostada em madeira ou ligada a ela por poucas folhas se sustenta', () => {
  const world = createWorld();
  world.setBlock(0, 5, 0, BlockType.WOOD);
  for (let x = 1; x <= 8; x++) world.setBlock(x, 5, 0, BlockType.LEAVES);
  assert.equal(isLeafSupported(world, 1, 5, 0, LEAF_DECAY.supportDistance), true);
  assert.equal(isLeafSupported(world, LEAF_DECAY.supportDistance, 5, 0, LEAF_DECAY.supportDistance), true);
  assert.equal(isLeafSupported(world, LEAF_DECAY.supportDistance + 1, 5, 0, LEAF_DECAY.supportDistance), false);
});

test('folha isolada não se sustenta', () => {
  const world = createWorld();
  world.setBlock(3, 5, 3, BlockType.LEAVES);
  assert.equal(isLeafSupported(world, 3, 5, 3, LEAF_DECAY.supportDistance), false);
});

test('na dúvida, folhas perto de chunks não carregados são mantidas', () => {
  const world = createEmptyWorld({ height: 32, chunks: [[0, 0]] });
  world.setBlock(0, 5, 3, BlockType.LEAVES);
  assert.equal(isLeafSupported(world, 0, 5, 3, LEAF_DECAY.supportDistance), true);
});

test('quebrar o tronco inteiro faz a copa decair aos poucos', () => {
  const world = createWorld();
  growOak(world);
  const decay = new LeafDecay({ world, random: () => 0.5 });
  const leaves = countLeaves(world);
  breakTrunk(world);
  run(decay, LEAF_DECAY.minDelay * 0.5);
  assert.equal(countLeaves(world), leaves);
  run(decay, LEAF_DECAY.maxDelay + 1);
  assert.equal(countLeaves(world), 0);
});

test('a copa se mantém enquanto restar algum bloco do tronco', () => {
  const world = createWorld();
  growOak(world);
  const decay = new LeafDecay({ world, random: () => 0.5 });
  const leaves = countLeaves(world);
  world.setBlock(0, 3, 0, BlockType.AIR);
  run(decay, LEAF_DECAY.maxDelay + 1);
  assert.equal(countLeaves(world), leaves);
});

test('folhas colocadas pelo jogador nunca decaem', () => {
  const world = createWorld();
  growOak(world);
  world.setBlock(4, 7, 0, BlockType.PERSISTENT_LEAVES);
  const decay = new LeafDecay({ world, random: () => 0.5 });
  breakTrunk(world);
  run(decay, LEAF_DECAY.maxDelay + 1);
  assert.equal(countLeaves(world, BlockType.PERSISTENT_LEAVES), 1);
});

test('uma árvore vizinha com tronco não é afetada', () => {
  const world = createWorld();
  growOak(world, 0, 0);
  growOak(world, 9, 0);
  const decay = new LeafDecay({ world, random: () => 0.5 });
  const neighborLeaves = () => {
    let count = 0;
    for (let y = 0; y < 32; y++) for (let z = -3; z <= 3; z++) for (let x = 7; x <= 11; x++) if (world.getBlock(x, y, z) === BlockType.LEAVES) count += 1;
    return count;
  };
  const before = neighborLeaves();
  breakTrunk(world, 0, 0);
  run(decay, LEAF_DECAY.maxDelay + 1);
  assert.equal(neighborLeaves(), before);
});

test('recolocar madeira antes do prazo salva as folhas', () => {
  const world = createWorld();
  growOak(world);
  const decay = new LeafDecay({ world, random: () => 0.9 });
  const leaves = countLeaves(world);
  breakTrunk(world);
  world.setBlock(0, 7, 0, BlockType.WOOD);
  run(decay, LEAF_DECAY.maxDelay + 1);
  assert.equal(countLeaves(world), leaves);
});

test('quebrar uma folha de uma copa solta limpa a copa inteira em cascata', () => {
  const world = createWorld();
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) world.setBlock(x, 10, z, BlockType.PINE_LEAVES);
  const decay = new LeafDecay({ world, random: () => 0.2 });
  world.setBlock(0, 10, 0, BlockType.AIR);
  run(decay, (LEAF_DECAY.maxDelay + 1) * 3);
  assert.equal(countLeaves(world, BlockType.PINE_LEAVES), 0);
});

test('findUnsupportedLeaves concorda com a verificação folha a folha em florestas geradas', async () => {
  const { ChunkGenerator } = await import('../src/world/chunkGenerator.js');
  const { ChunkedWorld } = await import('../src/world/chunkedWorld.js');
  const generator = new ChunkGenerator(42, 64);
  const world = new ChunkedWorld(64);
  for (let chunkZ = 1; chunkZ <= 5; chunkZ++) {
    for (let chunkX = -1; chunkX <= 3; chunkX++) world.loadChunk(generator.generate(chunkX, chunkZ));
  }
  let checkedLeaves = 0;
  [[6, 45, 20], [30, 60, 30], [10, 70, 26]].forEach(([x, z, y]) => {
    for (let dy = -2; dy <= 12; dy++) world.setBlock(x, y + dy, z, BlockType.AIR);
    const unsupported = new Set(findUnsupportedLeaves(world, x, y + 6, z, LEAF_DECAY).map(({ x: lx, y: ly, z: lz }) => `${lx},${ly},${lz}`));
    const radius = LEAF_DECAY.checkRadius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const [lx, ly, lz] = [x + dx, y + 6 + dy, z + dz];
          const type = world.getBlock(lx, ly, lz);
          if (type !== BlockType.LEAVES && type !== BlockType.PINE_LEAVES) continue;
          checkedLeaves += 1;
          assert.equal(unsupported.has(`${lx},${ly},${lz}`), !isLeafSupported(world, lx, ly, lz, LEAF_DECAY.supportDistance), `${lx},${ly},${lz}`);
        }
      }
    }
  });
  assert.ok(checkedLeaves > 100);
});

test('quebrar terra ou pedra não dispara verificação de folhas', () => {
  const world = createWorld();
  world.setBlock(3, 10, 3, BlockType.LEAVES);
  world.setBlock(3, 9, 3, BlockType.STONE);
  const decay = new LeafDecay({ world, random: () => 0.5 });
  world.setBlock(3, 9, 3, BlockType.AIR);
  assert.equal(decay.pendingCount, 0);
});

test('qualquer tipo de tronco sustenta as folhas', () => {
  [BlockType.PINE_WOOD, BlockType.ACACIA_WOOD, BlockType.JUNGLE_WOOD].forEach((log) => {
    const world = createWorld();
    world.setBlock(0, 5, 0, log);
    world.setBlock(1, 5, 0, BlockType.PINE_LEAVES);
    assert.equal(isLeafSupported(world, 1, 5, 0, LEAF_DECAY.supportDistance), true);
    assert.deepEqual(findUnsupportedLeaves(world, 0, 5, 0, LEAF_DECAY), []);
  });
});

test('quebrar o tronco de uma conífera faz as folhas de pinheiro decaírem', () => {
  const world = createWorld();
  world.setBlock(0, 2, 0, BlockType.GRASS);
  placePlant(world, { species: Species.CONIFER, x: 0, z: 0, groundY: 2, height: 8, variant: 0 });
  const decay = new LeafDecay({ world, random: () => 0.5 });
  assert.ok(countLeaves(world, BlockType.PINE_LEAVES) > 0);
  for (let y = 3; y <= 10; y++) world.setBlock(0, y, 0, BlockType.AIR);
  run(decay, LEAF_DECAY.maxDelay + 1);
  assert.equal(countLeaves(world, BlockType.PINE_LEAVES), 0);
});
