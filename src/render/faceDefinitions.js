export const FaceDirection = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  TOP: 'top',
  BACK: 'back',
  FRONT: 'front',
});

function tangentAxes(normal) {
  return [0, 1, 2].filter((axis) => normal[axis] === 0);
}

function defineFace(direction, normal, corners) {
  return Object.freeze({ direction, normal, tangents: tangentAxes(normal), corners });
}

function corner(position, uv) {
  return Object.freeze({ position, uv });
}

export const FACES = Object.freeze([
  defineFace(FaceDirection.LEFT, [-1, 0, 0], [
    corner([0, 1, 0], [0, 1]),
    corner([0, 0, 0], [0, 0]),
    corner([0, 1, 1], [1, 1]),
    corner([0, 0, 1], [1, 0]),
  ]),
  defineFace(FaceDirection.RIGHT, [1, 0, 0], [
    corner([1, 1, 1], [0, 1]),
    corner([1, 0, 1], [0, 0]),
    corner([1, 1, 0], [1, 1]),
    corner([1, 0, 0], [1, 0]),
  ]),
  defineFace(FaceDirection.BOTTOM, [0, -1, 0], [
    corner([1, 0, 1], [1, 0]),
    corner([0, 0, 1], [0, 0]),
    corner([1, 0, 0], [1, 1]),
    corner([0, 0, 0], [0, 1]),
  ]),
  defineFace(FaceDirection.TOP, [0, 1, 0], [
    corner([0, 1, 1], [1, 1]),
    corner([1, 1, 1], [0, 1]),
    corner([0, 1, 0], [1, 0]),
    corner([1, 1, 0], [0, 0]),
  ]),
  defineFace(FaceDirection.BACK, [0, 0, -1], [
    corner([1, 0, 0], [0, 0]),
    corner([0, 0, 0], [1, 0]),
    corner([1, 1, 0], [0, 1]),
    corner([0, 1, 0], [1, 1]),
  ]),
  defineFace(FaceDirection.FRONT, [0, 0, 1], [
    corner([0, 0, 1], [0, 0]),
    corner([1, 0, 1], [1, 0]),
    corner([0, 1, 1], [0, 1]),
    corner([1, 1, 1], [1, 1]),
  ]),
]);
