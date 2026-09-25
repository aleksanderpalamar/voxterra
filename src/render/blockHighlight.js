import * as THREE from 'three';

const OUTLINE_SIZE = 1.004;
const FILL_SIZE = 1.002;

function createOutline() {
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(OUTLINE_SIZE, OUTLINE_SIZE, OUTLINE_SIZE));
  const material = new THREE.LineBasicMaterial({ color: 0x101010, transparent: true, opacity: 0.85 });
  return new THREE.LineSegments(edges, material);
}

function createFill() {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  return new THREE.Mesh(new THREE.BoxGeometry(FILL_SIZE, FILL_SIZE, FILL_SIZE), material);
}

export class BlockHighlight {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.add(createOutline(), createFill());
    this.group.visible = false;
    scene.add(this.group);
  }

  show(position) {
    this.group.position.set(position.x + 0.5, position.y + 0.5, position.z + 0.5);
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }
}
