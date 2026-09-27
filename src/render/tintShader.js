const VERTEX_DECLARATIONS = 'attribute vec3 tint;\nvarying vec3 vTint;';
const VERTEX_ASSIGNMENT = 'vTint = tint;';
const FRAGMENT_DECLARATIONS = 'varying vec3 vTint;';
const FRAGMENT_TINT = [
  'float tintGreenness = (diffuseColor.g - max(diffuseColor.r, diffuseColor.b)) / max(diffuseColor.g, 0.0001);',
  'diffuseColor.rgb *= mix(vec3(1.0), vTint, smoothstep(0.08, 0.2, tintGreenness));',
].join('\n');

function injectAfter(source, marker, code) {
  if (!source.includes(marker)) throw new Error(`Ponto de injeção ${marker} ausente no shader.`);
  return source.replace(marker, `${marker}\n${code}`);
}

export function enableClimateTint(material) {
  material.onBeforeCompile = (shader) => {
    const vertex = injectAfter(shader.vertexShader, '#include <common>', VERTEX_DECLARATIONS);
    const fragment = injectAfter(shader.fragmentShader, '#include <common>', FRAGMENT_DECLARATIONS);
    shader.vertexShader = injectAfter(vertex, '#include <begin_vertex>', VERTEX_ASSIGNMENT);
    shader.fragmentShader = injectAfter(fragment, '#include <color_fragment>', FRAGMENT_TINT);
  };
  return material;
}
