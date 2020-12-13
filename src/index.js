// Polyfill `Promise`.
window.Promise = window.Promise || require('promise-polyfill');

// WebVR polyfill
// Check before the polyfill runs.
window.hasNativeWebVRImplementation = !!window.navigator.getVRDisplays ||
                                      !!window.navigator.getVRDevices;
window.hasNativeWebXRImplementation = navigator.xr !== undefined;

// If native WebXR or WebVR are defined WebVRPolyfill does not initialize.
if (!window.hasNativeWebXRImplementation && !window.hasNativeWebVRImplementation) {
  let isIOSOlderThan10 = require('./utils/isIOSOlderThan10');
  // Workaround for iOS Safari canvas sizing issues in stereo (webvr-polyfill/issues/102).
  // Only for iOS on versions older than 10.
  let bufferScale = isIOSOlderThan10(window.navigator.userAgent) ? 1 / window.devicePixelRatio : 1;
  let WebVRPolyfill = require('webvr-polyfill');
  let polyfillConfig = {
    BUFFER_SCALE: bufferScale,
    CARDBOARD_UI_DISABLED: true,
    ROTATE_INSTRUCTIONS_DISABLED: true,
    MOBILE_WAKE_LOCK: !!window.cordova
  };
  window.webvrpolyfill = new WebVRPolyfill(polyfillConfig);
}

let utils = require('./utils/');
let debug = utils.debug;

if (utils.isIE11) {
  // Polyfill `CustomEvent`.
  require('custom-event-polyfill');
  // Polyfill String.startsWith.
  require('../vendor/starts-with-polyfill');
}

let error = debug('A-Frame:error');
let warn = debug('A-Frame:warn');

if (window.document.currentScript && window.document.currentScript.parentNode !==
    window.document.head && !window.debug) {
  warn('Put the A-Frame <script> tag in the <head> of the HTML *before* the scene to ' +
       'ensure everything for A-Frame is properly registered before they are used from ' +
       'HTML.');
}

// Error if not using a server.
if (!window.cordova && window.location.protocol === 'file:') {
  error(
    'This HTML file is currently being served via the file:// protocol. ' +
    'Assets, textures, and models WILL NOT WORK due to cross-origin policy! ' +
    'Please use a local or hosted server: ' +
    'https://aframe.io/docs/0.5.0/introduction/getting-started.html#using-a-local-server.');
}

require('present'); // Polyfill `performance.now()`.

// CSS.
if (utils.device.isBrowserEnvironment) {
  require('./style/aframe.css');
  require('./style/rStats.css');
}

// Required before `AEntity` so that all components are registered.
let AScene = require('./core/scene/a-scene').AScene;
let components = require('./core/component').components;
let registerComponent = require('./core/component').registerComponent;
let registerGeometry = require('./core/geometry').registerGeometry;
let registerPrimitive = require('./extras/primitives/primitives').registerPrimitive;
let registerShader = require('./core/shader').registerShader;
let registerSystem = require('./core/system').registerSystem;
let shaders = require('./core/shader').shaders;
let systems = require('./core/system').systems;
// Exports THREE to window so three.js can be used without alteration.
let THREE = window.THREE = require('./lib/three');

let pkg = require('../package');

require('./components/index'); // Register standard components.
require('./geometries/index'); // Register standard geometries.
require('./shaders/index'); // Register standard shaders.
require('./systems/index'); // Register standard systems.
let ANode = require('./core/a-node');
let AEntity = require('./core/a-entity'); // Depends on ANode and core components.

require('./core/a-assets');
require('./core/a-cubemap');
require('./core/a-mixin');

// Extras.
require('./extras/components/');
require('./extras/primitives/');

console.log('A-Frame Version: 1.1.0 (Date 2020-12-09, Commit #41079d2a)');
console.log('THREE Version (https://github.com/supermedium/three.js):',
            pkg.dependencies['super-three']);
console.log('WebVR Polyfill Version:', pkg.dependencies['webvr-polyfill']);

module.exports = window.AFRAME = {
  AComponent: require('./core/component').Component,
  AEntity: AEntity,
  ANode: ANode,
  ANIME: require('super-animejs'),
  AScene: AScene,
  components: components,
  coreComponents: Object.keys(components),
  geometries: require('./core/geometry').geometries,
  registerComponent: registerComponent,
  registerElement: require('./core/a-register-element').registerElement,
  registerGeometry: registerGeometry,
  registerPrimitive: registerPrimitive,
  registerShader: registerShader,
  registerSystem: registerSystem,
  primitives: {
    getMeshMixin: require('./extras/primitives/getMeshMixin'),
    primitives: require('./extras/primitives/primitives').primitives
  },
  scenes: require('./core/scene/scenes'),
  schema: require('./core/schema'),
  shaders: shaders,
  systems: systems,
  THREE: THREE,
  utils: utils,
  version: pkg.version
};
