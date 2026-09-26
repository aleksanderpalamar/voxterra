import * as THREE from 'three';
import { Medium } from '../world/blockTypes.js';
import { atmosphereFor } from './atmosphereSettings.js';

const TINT_DISTANCE = 0.06;
const TINT_RENDER_ORDER = 1000;

function createTintOverlay(camera) {
  const material = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false });
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  overlay.position.z = -TINT_DISTANCE;
  overlay.renderOrder = TINT_RENDER_ORDER;
  overlay.visible = false;
  camera.add(overlay);
  return overlay;
}

export class Atmosphere {
  constructor({ scene, camera, sky, clouds }) {
    this.scene = scene;
    this.sky = sky;
    this.clouds = clouds;
    this.air = { color: scene.fog.color.getHex(), near: scene.fog.near, far: scene.fog.far };
    this.overlay = createTintOverlay(camera);
    this.medium = Medium.AIR;
    scene.add(camera);
  }

  apply(medium) {
    if (medium === this.medium) return;
    this.medium = medium;
    const settings = atmosphereFor(medium, this.air);
    this.scene.fog.color.setHex(settings.fogColor);
    this.scene.fog.near = settings.near;
    this.scene.fog.far = settings.far;
    this.scene.background.setHex(settings.background);
    this.sky.setVisible(settings.skyVisible);
    this.clouds.setVisible(settings.skyVisible);
    this.applyTint(settings.tint);
  }

  applyTint(tint) {
    this.overlay.visible = tint !== null;
    if (tint === null) return;
    this.overlay.material.color.setHex(tint.color);
    this.overlay.material.opacity = tint.opacity;
  }
}
