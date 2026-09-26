import * as THREE from 'three';
import { SKY_COLORS } from './renderContext.js';

const DOME_RADIUS = 400;
const SUN_SPRITE_DISTANCE = 340;
const SUN_SPRITE_SCALE = 90;
const GLOW_TEXTURE_SIZE = 128;

function createDomeGeometry() {
  const geometry = new THREE.SphereGeometry(DOME_RADIUS, 32, 16);
  const zenith = new THREE.Color(SKY_COLORS.zenith);
  const horizon = new THREE.Color(SKY_COLORS.horizon);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const height = Math.max(positions.getY(i) / DOME_RADIUS, 0);
    color.lerpColors(horizon, zenith, Math.pow(height, 0.6));
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function createDome() {
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const dome = new THREE.Mesh(createDomeGeometry(), material);
  dome.renderOrder = -2;
  return dome;
}

function createGlowTexture(document) {
  const canvas = document.createElement('canvas');
  canvas.width = GLOW_TEXTURE_SIZE;
  canvas.height = GLOW_TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  const center = GLOW_TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255, 255, 245, 1)');
  gradient.addColorStop(0.18, 'rgba(255, 248, 220, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 236, 180, 0.45)');
  gradient.addColorStop(1, 'rgba(255, 230, 170, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSunSprite(document) {
  const material = new THREE.SpriteMaterial({
    map: createGlowTexture(document),
    fog: false,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(SUN_SPRITE_SCALE);
  sprite.renderOrder = -1;
  return sprite;
}

export class Sky {
  constructor(scene, document, sunDirection) {
    this.sunDirection = sunDirection.clone();
    this.dome = createDome();
    this.sun = createSunSprite(document);
    scene.add(this.dome, this.sun);
  }

  setVisible(visible) {
    this.dome.visible = visible;
    this.sun.visible = visible;
  }

  follow(cameraPosition) {
    this.dome.position.copy(cameraPosition);
    this.sun.position.copy(cameraPosition).addScaledVector(this.sunDirection, SUN_SPRITE_DISTANCE);
  }
}
