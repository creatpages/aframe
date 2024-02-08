var THREE = require('../lib/three');

var COLOR_MAPS = new Set([
  'emissiveMap',
  'envMap',
  'map',
  'specularMap'
]);

/**
 * Set texture properties such as repeat and offset.
 *
 * @param {object} data - With keys like `repeat`.
*/
function setTextureProperties (texture, data) {
  var offset = data.offset || {x: 0, y: 0};
  var repeat = data.repeat || {x: 1, y: 1};
  var npot = data.npot || false;
  var anisotropy = data.anisotropy || THREE.Texture.DEFAULT_ANISOTROPY;
  var wrapS = texture.wrapS;
  var wrapT = texture.wrapT;
  var magFilter = texture.magFilter;
  var minFilter = texture.minFilter;

  // To support NPOT textures, wrap must be ClampToEdge (not Repeat),
  // and filters must not use mipmaps (i.e. Nearest or Linear).
  if (npot) {
    wrapS = THREE.ClampToEdgeWrapping;
    wrapT = THREE.ClampToEdgeWrapping;
    magFilter = THREE.LinearFilter;
    minFilter = THREE.LinearFilter;
  }

  // Set wrap mode to repeat only if repeat isn't 1/1. Power-of-two is required to repeat.
  if (repeat.x !== 1 || repeat.y !== 1) {
    wrapS = THREE.RepeatWrapping;
    wrapT = THREE.RepeatWrapping;
  }

  // Apply texture properties
  texture.offset.set(offset.x, offset.y);
  texture.repeat.set(repeat.x, repeat.y);

  if (texture.wrapS !== wrapS || texture.wrapT !== wrapT ||
      texture.magFilter !== magFilter || texture.minFilter !== minFilter ||
      texture.anisotropy !== anisotropy) {
    texture.wrapS = wrapS;
    texture.wrapT = wrapT;
    texture.magFilter = magFilter;
    texture.minFilter = minFilter;
    texture.anisotropy = anisotropy;
    texture.needsUpdate = true;
  }
}
module.exports.setTextureProperties = setTextureProperties;

/**
 * Update `material` texture property (usually but not always `map`)
 * from `data` property (usually but not always `src`).
 *
 * @param {object} shader - A-Frame shader instance.
 * @param {object} data
 */
module.exports.updateMapMaterialFromData = function (materialName, dataName, shader, data) {
  var el = shader.el;
  var material = shader.material;
  var rendererSystem = el.sceneEl.systems.renderer;
  var src = data[dataName];

  // Because a single material / shader may have multiple textures,
  // we need to remember the source value for this data property
  // to avoid redundant operations which can be expensive otherwise
  // (e.g. video texture loads).
  if (!shader.materialSrcs) { shader.materialSrcs = {}; }

  if (!src) {
    // Forget the prior material src.
    delete shader.materialSrcs[materialName];
    // Remove the texture.
    setMap(null);
    return;
  }

  // If material src hasn't changed, and we already have a texture,
  // just update properties, but don't reload the texture.
  if (src === shader.materialSrcs[materialName] &&
      material[materialName]) {
    setTextureProperties(material[materialName], data);
    return;
  }

  // Remember the new src for this texture (there may be multiple).
  shader.materialSrcs[materialName] = src;

  // If the new material src is already a texture, just use it.
  if (src instanceof THREE.Texture) { setMap(src); } else {
    // Load texture for the new material src.
    // (And check if we should still use it once available in callback.)
    el.sceneEl.systems.material.loadTexture(src,
      {src: src, repeat: data.repeat, offset: data.offset, npot: data.npot, anisotropy: data.anisotropy},
      checkSetMap);
  }

  function checkSetMap (texture) {
    // If the source has been changed, don't use loaded texture.
    if (shader.materialSrcs[materialName] !== src) { return; }
    setMap(texture);
  }

  function setMap (texture) {
    material[materialName] = texture;
    if (texture && COLOR_MAPS.has(materialName)) {
      rendererSystem.applyColorCorrection(texture);
    }
    material.needsUpdate = true;
    handleTextureEvents(el, texture);
  }
};

/**
 * Update `material.map` given `data.src`. For standard and flat shaders.
 *
 * @param {object} shader - A-Frame shader instance.
 * @param {object} data
 */
module.exports.updateMap = function (shader, data) {
  return module.exports.updateMapMaterialFromData('map', 'src', shader, data);
};

/**
 * Updates the material's maps which give the illusion of extra geometry.
 *
 * @param {string} longType - The friendly name of the map from the component e.g. ambientOcclusionMap becomes aoMap in THREE.js
 * @param {object} shader - A-Frame shader instance
 * @param {object} data
 */
module.exports.updateDistortionMap = function (longType, shader, data) {
  var shortType = longType;
  if (longType === 'ambientOcclusion') { shortType = 'ao'; }

  var info = {};
  info.src = data[longType + 'Map'];

  // Pass through the repeat and offset to be handled by the material loader.
  info.offset = data[longType + 'TextureOffset'];
  info.repeat = data[longType + 'TextureRepeat'];
  info.wrap = data[longType + 'TextureWrap'];
  return module.exports.updateMapMaterialFromData(shortType + 'Map', 'src', shader, info);
};

/**
 * Emit event on entities on texture-related events.
 *
 * @param {Element} el - Entity.
 * @param {object} texture - three.js Texture.
 */
function handleTextureEvents (el, texture) {
  if (!texture) { return; }

  el.emit('materialtextureloaded', {src: texture.image, texture: texture});

  // Video events.
  if (!texture.image || texture.image.tagName !== 'VIDEO') { return; }

  texture.image.addEventListener('loadeddata', function emitVideoTextureLoadedDataAll () {
    el.emit('materialvideoloadeddata', {src: texture.image, texture: texture});
  });
  texture.image.addEventListener('ended', function emitVideoTextureEndedAll () {
    // Works for non-looping videos only.
    el.emit('materialvideoended', {src: texture.image, texture: texture});
  });
}
module.exports.handleTextureEvents = handleTextureEvents;
