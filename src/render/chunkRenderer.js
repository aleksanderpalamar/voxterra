import * as THREE from 'three';
import { buildChunkMesh } from './chunkMesher.js';
import { MeshScheduler } from './meshScheduler.js';
import { CHUNK_SIZE, chunkKey } from '../world/chunkLayout.js';

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
  constructor(scene, source, height, material, tileUv) {
    this.scene = scene;
    this.source = source;
    this.height = height;
    this.material = material;
    this.tileUv = tileUv;
    this.scheduler = new MeshScheduler(source.isChunkMeshable);
    this.meshes = new Map();
  }

  get meshCount() {
    return this.meshes.size;
  }

  handleChunkLoaded(chunkX, chunkZ) {
    this.scheduler.chunkLoaded(chunkX, chunkZ);
  }

  handleChunkUnloaded(chunkX, chunkZ) {
    this.scheduler.chunkUnloaded(chunkX, chunkZ).forEach((chunk) => this.removeMesh(chunk.chunkX, chunk.chunkZ));
  }

  invalidateBlock(x, z) {
    this.scheduler.blockChanged(x, z);
  }

  update(centerChunkX, centerChunkZ, budget) {
    this.scheduler.takeUrgent().forEach((chunk) => this.rebuild(chunk.chunkX, chunk.chunkZ));
    this.scheduler.takeNearest(budget, centerChunkX, centerChunkZ)
      .forEach((chunk) => this.rebuild(chunk.chunkX, chunk.chunkZ));
  }

  buildPending(centerChunkX, centerChunkZ) {
    this.update(centerChunkX, centerChunkZ, Infinity);
  }

  boundsOf(chunkX, chunkZ) {
    const minX = chunkX * CHUNK_SIZE;
    const minZ = chunkZ * CHUNK_SIZE;
    return { minX, minY: 0, minZ, maxX: minX + CHUNK_SIZE, maxY: this.height, maxZ: minZ + CHUNK_SIZE };
  }

  rebuild(chunkX, chunkZ) {
    const meshData = buildChunkMesh(this.source, this.boundsOf(chunkX, chunkZ), this.tileUv);
    this.removeMesh(chunkX, chunkZ);
    if (meshData.indices.length === 0) return;
    const mesh = new THREE.Mesh(createGeometry(meshData), this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes.set(chunkKey(chunkX, chunkZ), mesh);
  }

  removeMesh(chunkX, chunkZ) {
    const key = chunkKey(chunkX, chunkZ);
    const mesh = this.meshes.get(key);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    this.meshes.delete(key);
  }
}
