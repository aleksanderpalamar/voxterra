import * as THREE from 'three';
import { CLOUD_SETTINGS, cloudCells, cloudTileOrigin } from './cloudField.js';

const TILE_COPIES = Object.freeze([[0, 0], [1, 0], [0, 1], [1, 1]]);

function createCloudMesh(cells, settings, span) {
  const geometry = new THREE.BoxGeometry(settings.cellSize, settings.thickness, settings.cellSize);
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geometry, material, cells.length * TILE_COPIES.length);
  const matrix = new THREE.Matrix4();
  cells.forEach((cell, cellIndex) => {
    TILE_COPIES.forEach(([copyX, copyZ], copyIndex) => {
      matrix.makeTranslation(cell.x * settings.cellSize + copyX * span, 0, cell.z * settings.cellSize + copyZ * span);
      mesh.setMatrixAt(cellIndex * TILE_COPIES.length + copyIndex, matrix);
    });
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

export class Clouds {
  constructor(scene, seed, settings = CLOUD_SETTINGS) {
    this.settings = settings;
    this.span = settings.cellSize * settings.cellsPerSide;
    this.drift = 0;
    this.mesh = createCloudMesh(cloudCells(seed, settings), settings, this.span);
    this.mesh.position.y = settings.altitude;
    scene.add(this.mesh);
  }

  setVisible(visible) {
    this.mesh.visible = visible;
  }

  update(dt, cameraPosition) {
    this.drift = (this.drift + dt * this.settings.driftSpeed) % this.span;
    this.mesh.position.x = cloudTileOrigin(cameraPosition.x, this.drift, this.span);
    this.mesh.position.z = cloudTileOrigin(cameraPosition.z, 0, this.span);
  }
}
