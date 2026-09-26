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

function createLayerMesh(meshData, material, castShadow) {
  if (meshData.indices.length === 0) return null;
  const mesh = new THREE.Mesh(createGeometry(meshData), material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

export class ChunkRenderer {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.meshes = new Map();
  }

  get meshCount() {
    return this.meshes.size;
  }

  apply(chunkX, chunkZ, meshData) {
    this.remove(chunkX, chunkZ);
    const layers = [
      createLayerMesh(meshData.solid, this.materials.solid, true),
      createLayerMesh(meshData.water, this.materials.water, false),
    ].filter((mesh) => mesh !== null);
    if (layers.length === 0) return;
    layers.forEach((mesh) => this.scene.add(mesh));
    this.meshes.set(chunkKey(chunkX, chunkZ), layers);
  }

  remove(chunkX, chunkZ) {
    const key = chunkKey(chunkX, chunkZ);
    const layers = this.meshes.get(key);
    if (!layers) return;
    layers.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.meshes.delete(key);
  }
}
