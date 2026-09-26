import * as THREE from 'three';
import { chunkKey } from '../world/chunkLayout.js';

function createGeometry(meshData) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(meshData.colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

export class ChunkRenderer {
  constructor(scene, material) {
    this.scene = scene;
    this.material = material;
    this.meshes = new Map();
  }

  get meshCount() {
    return this.meshes.size;
  }

  apply(chunkX, chunkZ, meshData) {
    this.remove(chunkX, chunkZ);
    if (meshData.indices.length === 0) return;
    const mesh = new THREE.Mesh(createGeometry(meshData), this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes.set(chunkKey(chunkX, chunkZ), mesh);
  }

  remove(chunkX, chunkZ) {
    const key = chunkKey(chunkX, chunkZ);
    const mesh = this.meshes.get(key);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    this.meshes.delete(key);
  }
}
