import * as THREE from 'three';
import { buildChunkMesh } from './chunkMesher.js';
import { CHUNK_SIZE } from '../world/chunkLayout.js';

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
  constructor(scene, source, dimensions, material, tileUv) {
    this.scene = scene;
    this.source = source;
    this.dimensions = dimensions;
    this.material = material;
    this.tileUv = tileUv;
    this.chunksX = Math.ceil(dimensions.sizeX / CHUNK_SIZE);
    this.chunksZ = Math.ceil(dimensions.sizeZ / CHUNK_SIZE);
    this.meshes = new Map();
    this.dirty = new Set();
  }

  buildAll() {
    for (let key = 0; key < this.chunksX * this.chunksZ; key++) {
      this.rebuild(key);
    }
    this.dirty.clear();
  }

  invalidateBlock(x, z) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = this.chunkKeyAt(x + dx, z + dz);
        if (key !== null) this.dirty.add(key);
      }
    }
  }

  flush() {
    this.dirty.forEach((key) => this.rebuild(key));
    this.dirty.clear();
  }

  chunkKeyAt(x, z) {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    if (chunkX < 0 || chunkZ < 0 || chunkX >= this.chunksX || chunkZ >= this.chunksZ) return null;
    return chunkX + chunkZ * this.chunksX;
  }

  boundsOf(key) {
    const minX = (key % this.chunksX) * CHUNK_SIZE;
    const minZ = Math.floor(key / this.chunksX) * CHUNK_SIZE;
    return {
      minX,
      minY: 0,
      minZ,
      maxX: Math.min(minX + CHUNK_SIZE, this.dimensions.sizeX),
      maxY: this.dimensions.sizeY,
      maxZ: Math.min(minZ + CHUNK_SIZE, this.dimensions.sizeZ),
    };
  }

  rebuild(key) {
    const meshData = buildChunkMesh(this.source, this.boundsOf(key), this.tileUv);
    this.removeMesh(key);
    if (meshData.indices.length === 0) return;
    const mesh = new THREE.Mesh(createGeometry(meshData), this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes.set(key, mesh);
  }

  removeMesh(key) {
    const mesh = this.meshes.get(key);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    this.meshes.delete(key);
  }
}
