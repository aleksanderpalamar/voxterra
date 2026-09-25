import * as THREE from 'three';
import { createRandom } from '../core/random.js';
import { createNoise2D, fractalNoise2D } from '../core/noise.js';

const CLOUD_SETTINGS = Object.freeze({
  altitude: 78,
  cellSize: 8,
  cellsPerSide: 40,
  thickness: 3,
  threshold: 0.12,
  noiseScale: 0.14,
  driftSpeed: 1.6,
});

function cloudCells(seed, settings) {
  const noise = createNoise2D(createRandom(seed));
  const cells = [];
  for (let z = 0; z < settings.cellsPerSide; z++) {
    for (let x = 0; x < settings.cellsPerSide; x++) {
      const value = fractalNoise2D(noise, x * settings.noiseScale, z * settings.noiseScale, 3);
      if (value > settings.threshold) cells.push({ x, z });
    }
  }
  return cells;
}

function createCloudMesh(cells, settings) {
  const geometry = new THREE.BoxGeometry(settings.cellSize, settings.thickness, settings.cellSize);
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geometry, material, cells.length * 2);
  const matrix = new THREE.Matrix4();
  const span = settings.cellSize * settings.cellsPerSide;
  cells.forEach((cell, index) => {
    [0, 1].forEach((copy) => {
      const x = cell.x * settings.cellSize - copy * span;
      matrix.makeTranslation(x, 0, cell.z * settings.cellSize);
      mesh.setMatrixAt(index * 2 + copy, matrix);
    });
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

export class Clouds {
  constructor(scene, seed, worldCenter, settings = CLOUD_SETTINGS) {
    this.settings = settings;
    this.span = settings.cellSize * settings.cellsPerSide;
    this.offset = 0;
    this.origin = { x: worldCenter.x - this.span / 2, z: worldCenter.z - this.span / 2 };
    this.mesh = createCloudMesh(cloudCells(seed, settings), settings);
    this.mesh.position.set(this.origin.x, settings.altitude, this.origin.z);
    scene.add(this.mesh);
  }

  update(dt) {
    this.offset = (this.offset + dt * this.settings.driftSpeed) % this.span;
    this.mesh.position.x = this.origin.x + this.offset;
  }
}
