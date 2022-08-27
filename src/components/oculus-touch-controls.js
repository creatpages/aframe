var bind = require('../utils/bind');
var registerComponent = require('../core/component').registerComponent;
var THREE = require('../lib/three');

var trackedControlsUtils = require('../utils/tracked-controls');
var checkControllerPresentAndSetup = trackedControlsUtils.checkControllerPresentAndSetup;
var emitIfAxesChanged = trackedControlsUtils.emitIfAxesChanged;
var onButtonEvent = trackedControlsUtils.onButtonEvent;

var isWebXRAvailable = require('../utils/').device.isWebXRAvailable;

var GAMEPAD_ID_WEBXR = 'oculus-touch';
var GAMEPAD_ID_WEBVR = 'Oculus Touch';

// Prefix for Gen1 and Gen2 Oculus Touch Controllers.
var GAMEPAD_ID_PREFIX = isWebXRAvailable ? GAMEPAD_ID_WEBXR : GAMEPAD_ID_WEBVR;

// First generation model URL.
var TOUCH_CONTROLLER_MODEL_BASE_URL = 'https://cdn.aframe.io/controllers/oculus/oculus-touch-controller-';

var OCULUS_TOUCH_WEBVR = {
  left: {
    modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'left.gltf',
    rayOrigin: {origin: {x: 0.008, y: -0.01, z: 0}, direction: {x: 0, y: -0.8, z: -1}},
    modelPivotOffset: new THREE.Vector3(-0.005, 0.003, -0.055),
    modelPivotRotation: new THREE.Euler(0, 0, 0)
  },
  right: {
    modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'right.gltf',
    rayOrigin: {origin: {x: -0.008, y: -0.01, z: 0}, direction: {x: 0, y: -0.8, z: -1}},
    modelPivotOffset: new THREE.Vector3(0.005, 0.003, -0.055),
    modelPivotRotation: new THREE.Euler(0, 0, 0)
  }
};

var OCULUS_TOUCH_WEBXR = {
  left: {
    modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'left.gltf',
    rayOrigin: {origin: {x: 0.002, y: -0.005, z: -0.03}, direction: {x: 0, y: -0.8, z: -1}},
    modelPivotOffset: new THREE.Vector3(-0.005, 0.036, -0.037),
    modelPivotRotation: new THREE.Euler(Math.PI / 4.5, 0, 0)
  },
  right: {
    modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'right.gltf',
    rayOrigin: {origin: {x: -0.002, y: -0.005, z: -0.03}, direction: {x: 0, y: -0.8, z: -1}},
    modelPivotOffset: new THREE.Vector3(0.005, 0.036, -0.037),
    modelPivotRotation: new THREE.Euler(Math.PI / 4.5, 0, 0)
  }
};

var OCULUS_TOUCH_CONFIG = isWebXRAvailable ? OCULUS_TOUCH_WEBXR : OCULUS_TOUCH_WEBVR;

var CONTROLLER_DEFAULT = 'oculus-touch';
var CONTROLLER_PROPERTIES = {
  'oculus-touch': OCULUS_TOUCH_CONFIG,
  'oculus-touch-v2': {
    left: {
      modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'gen2-left.gltf',
      rayOrigin: {origin: {x: -0.01, y: 0, z: -0.02}, direction: {x: 0, y: -0.5, z: -1}},
      modelPivotOffset: new THREE.Vector3(0, 0, 0),
      modelPivotRotation: new THREE.Euler(0, 0, 0)
    },
    right: {
      modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'gen2-right.gltf',
      rayOrigin: {origin: {x: 0.01, y: 0, z: -0.02}, direction: {x: 0, y: -0.5, z: -1}},
      modelPivotOffset: new THREE.Vector3(0, 0, 0),
      modelPivotRotation: new THREE.Euler(0, 0, 0)
    }
  },
  'oculus-touch-v3': {
    left: {
      modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'v3-left.glb',
      rayOrigin: {origin: {x: 0.015, y: 0.005, z: 0}, direction: {x: 0, y: 0, z: -1}},
      modelPivotOffset: new THREE.Vector3(0.01, -0.01, 0.05),
      modelPivotRotation: new THREE.Euler(Math.PI / 4, 0, 0)
    },
    right: {
      modelUrl: TOUCH_CONTROLLER_MODEL_BASE_URL + 'v3-right.glb',
      rayOrigin: {origin: {x: -0.015, y: 0.005, z: 0}, direction: {x: 0, y: 0, z: -1}},
      modelPivotOffset: new THREE.Vector3(-0.01, -0.01, 0.05),
      modelPivotRotation: new THREE.Euler(Math.PI / 4, 0, 0)
    }
  }
};

/**
 * Button indices:
 * 0 - thumbstick (which has separate axismove / thumbstickmoved events)
 * 1 - trigger (with analog value, which goes up to 1)
 * 2 - grip (with analog value, which goes up to 1)
 * 3 - X (left) or A (right)
 * 4 - Y (left) or B (right)
 * 5 - surface (touch only)
 */
var INPUT_MAPPING_WEBVR = {
  left: {
    axes: {thumbstick: [0, 1]},
    buttons: ['thumbstick', 'trigger', 'grip', 'xbutton', 'ybutton', 'surface']
  },
  right: {
    axes: {thumbstick: [0, 1]},
    buttons: ['thumbstick', 'trigger', 'grip', 'abutton', 'bbutton', 'surface']
  }
};

/**
 * Button indices:
 * 0 - trigger
 * 1 - grip
 * 2 - none
 * 3 - thumbstick
 * 4 - X or A button
 * 5 - Y or B button
 * 6 - surface
 *
 * Axis:
 * 0 - none
 * 1 - none
 * 2 - thumbstick
 * 3 - thumbstick
 * Reference: https://github.com/immersive-web/webxr-input-profiles/blob/master/packages/registry/profiles/oculus/oculus-touch.json
 */
var INPUT_MAPPING_WEBXR = {
  left: {
    axes: {thumbstick: [2, 3]},
    buttons: ['trigger', 'grip', 'none', 'thumbstick', 'xbutton', 'ybutton', 'surface']
  },
  right: {
    axes: {thumbstick: [2, 3]},
    buttons: ['trigger', 'grip', 'none', 'thumbstick', 'abutton', 'bbutton', 'surface']
  }
};

var INPUT_MAPPING = isWebXRAvailable ? INPUT_MAPPING_WEBXR : INPUT_MAPPING_WEBVR;

/**
 * Oculus Touch controls.
 * Interface with Oculus Touch controllers and map Gamepad events to
 * controller buttons: thumbstick, trigger, grip, xbutton, ybutton, surface
 * Load a controller model and highlight the pressed buttons.
 */
module.exports.Component = registerComponent('oculus-touch-controls', {
  schema: {
    hand: {default: 'left'},
    buttonColor: {type: 'color', default: '#999'},  // Off-white.
    buttonTouchColor: {type: 'color', default: '#8AB'},
    buttonHighlightColor: {type: 'color', default: '#2DF'},  // Light blue.
    model: {default: true},
    controllerType: {default: 'auto', oneOf: ['auto', 'oculus-touch', 'oculus-touch-v2', 'oculus-touch-v3']},
    orientationOffset: {type: 'vec3', default: {x: 43, y: 0, z: 0}}
  },

  mapping: INPUT_MAPPING,

  bindMethods: function () {
    this.onButtonChanged = bind(this.onButtonChanged, this);
    this.onThumbstickMoved = bind(this.onThumbstickMoved, this);
    this.onModelLoaded = bind(this.onModelLoaded, this);
    this.onControllersUpdate = bind(this.onControllersUpdate, this);
    this.checkIfControllerPresent = bind(this.checkIfControllerPresent, this);
    this.onAxisMoved = bind(this.onAxisMoved, this);
  },

  init: function () {
    var self = this;
    this.onButtonDown = function (evt) { onButtonEvent(evt.detail.id, 'down', self, self.data.hand); };
    this.onButtonUp = function (evt) { onButtonEvent(evt.detail.id, 'up', self, self.data.hand); };
    this.onButtonTouchStart = function (evt) { onButtonEvent(evt.detail.id, 'touchstart', self, self.data.hand); };
    this.onButtonTouchEnd = function (evt) { onButtonEvent(evt.detail.id, 'touchend', self, self.data.hand); };
    this.controllerPresent = false;
    this.lastControllerCheck = 0;
    this.previousButtonValues = {};
    this.rendererSystem = this.el.sceneEl.systems.renderer;
    this.bindMethods();
    this.triggerEuler = new THREE.Euler();
  },

  addEventListeners: function () {
    var el = this.el;
    el.addEventListener('buttonchanged', this.onButtonChanged);
    el.addEventListener('buttondown', this.onButtonDown);
    el.addEventListener('buttonup', this.onButtonUp);
    el.addEventListener('touchstart', this.onButtonTouchStart);
    el.addEventListener('touchend', this.onButtonTouchEnd);
    el.addEventListener('axismove', this.onAxisMoved);
    el.addEventListener('model-loaded', this.onModelLoaded);
    el.addEventListener('thumbstickmoved', this.onThumbstickMoved);
    this.controllerEventsActive = true;
  },

  removeEventListeners: function () {
    var el = this.el;
    el.removeEventListener('buttonchanged', this.onButtonChanged);
    el.removeEventListener('buttondown', this.onButtonDown);
    el.removeEventListener('buttonup', this.onButtonUp);
    el.removeEventListener('touchstart', this.onButtonTouchStart);
    el.removeEventListener('touchend', this.onButtonTouchEnd);
    el.removeEventListener('axismove', this.onAxisMoved);
    el.removeEventListener('model-loaded', this.onModelLoaded);
    el.removeEventListener('thumbstickmoved', this.onThumbstickMoved);
    this.controllerEventsActive = false;
  },

  checkIfControllerPresent: function () {
    checkControllerPresentAndSetup(this, GAMEPAD_ID_PREFIX, {
      hand: this.data.hand
    });
  },

  play: function () {
    this.checkIfControllerPresent();
    this.addControllersUpdateListener();
  },

  pause: function () {
    this.removeEventListeners();
    this.removeControllersUpdateListener();
  },

  loadModel: function (controller) {
    var data = this.data;
    var controllerId;

    if (!data.model) { return; }
    // Set the controller display model based on the data passed in.
    this.displayModel = CONTROLLER_PROPERTIES[data.controllerType] || CONTROLLER_PROPERTIES[CONTROLLER_DEFAULT];
    // If the developer is asking for auto-detection, use the retrieved displayName to identify the specific unit.
    if (data.controllerType === 'auto') {
      var trackedControlsSystem = this.el.sceneEl.systems['tracked-controls-webvr'];
      if (trackedControlsSystem && trackedControlsSystem.vrDisplay) {
        // WebVR
        var displayName = trackedControlsSystem.vrDisplay.displayName;
        if (/^Oculus Quest$/.test(displayName)) {
          this.displayModel = CONTROLLER_PROPERTIES['oculus-touch-v2'];
        }
      } else {
        // WebXR
        controllerId = CONTROLLER_DEFAULT;
        controllerId = controller.profiles.indexOf('oculus-touch-v2') !== -1 ? 'oculus-touch-v2' : controllerId;
        controllerId = controller.profiles.indexOf('oculus-touch-v3') !== -1 ? 'oculus-touch-v3' : controllerId;
        this.displayModel = CONTROLLER_PROPERTIES[controllerId];
      }
    }
    var modelUrl = this.displayModel[data.hand].modelUrl;
    this.isV3 = this.displayModel === CONTROLLER_PROPERTIES['oculus-touch-v3'];
    this.el.setAttribute('gltf-model', modelUrl);
  },

  injectTrackedControls: function (controller) {
    var data = this.data;
    var webXRId = GAMEPAD_ID_WEBXR;
    var webVRId = data.hand === 'right' ? 'Oculus Touch (Right)' : 'Oculus Touch (Left)';
    var id = isWebXRAvailable ? webXRId : webVRId;
    this.el.setAttribute('tracked-controls', {
      id: id,
      hand: data.hand,
      orientationOffset: data.orientationOffset,
      handTrackingEnabled: false
    });
    this.loadModel(controller);
  },

  addControllersUpdateListener: function () {
    this.el.sceneEl.addEventListener('controllersupdated', this.onControllersUpdate, false);
  },

  removeControllersUpdateListener: function () {
    this.el.sceneEl.removeEventListener('controllersupdated', this.onControllersUpdate, false);
  },

  onControllersUpdate: function () {
    // Note that due to gamepadconnected event propagation issues, we don't rely on events.
    this.checkIfControllerPresent();
  },

  onButtonChanged: function (evt) {
    // move the button models
    if (this.isV3) {
      this.onButtonChangedV3(evt);
    } else {
      var button = this.mapping[this.data.hand].buttons[evt.detail.id];
      var buttonMeshes = this.buttonMeshes;
      var analogValue;
      if (!button) { return; }

      if (button === 'trigger' || button === 'grip') { analogValue = evt.detail.state.value; }

      if (buttonMeshes) {
        if (button === 'trigger' && buttonMeshes.trigger) {
          buttonMeshes.trigger.rotation.x = this.originalXRotationTrigger - analogValue * (Math.PI / 26);
        }
        if (button === 'grip' && buttonMeshes.grip) {
          analogValue *= this.data.hand === 'left' ? -1 : 1;
          buttonMeshes.grip.position.x = this.originalXPositionGrip + analogValue * 0.004;
        }
      }
    }
    // Pass along changed event with button state, using the buttom mapping for convenience.
    this.el.emit(button + 'changed', evt.detail.state);
  },

  clickButtons: ['xbutton', 'ybutton', 'abutton', 'bbutton', 'thumbstick'],
  onButtonChangedV3: function (evt) {
    var button = this.mapping[this.data.hand].buttons[evt.detail.id];
    var buttonObjects = this.buttonObjects;
    var analogValue;
    if (!button) { return; }

    analogValue = evt.detail.state.value;
    analogValue *= this.data.hand === 'left' ? -1 : 1;

    if (button === 'trigger') {
      this.triggerEuler.copy(this.buttonRanges.trigger.min.rotation);
      this.triggerEuler.x += analogValue * this.buttonRanges.trigger.diff.x;
      this.triggerEuler.y += analogValue * this.buttonRanges.trigger.diff.y;
      this.triggerEuler.z += analogValue * this.buttonRanges.trigger.diff.z;
      buttonObjects.trigger.setRotationFromEuler(this.triggerEuler);
    } else if (button === 'grip') {
      buttonObjects.grip.position.x = buttonObjects.grip.minX + analogValue * 0.004;
    } else if (this.clickButtons.includes(button)) {
      buttonObjects[button].position.y = analogValue === 0 ? this.buttonRanges[button].unpressedY : this.buttonRanges[button].pressedY;
    }
  },

  onModelLoaded: function (evt) {
    if (this.isV3) {
      this.onModelLoadedV3(evt);
    } else {
      var controllerObject3D = this.controllerObject3D = evt.detail.model;
      var buttonMeshes;

      if (!this.data.model) { return; }

      buttonMeshes = this.buttonMeshes = {};

      buttonMeshes.grip = controllerObject3D.getObjectByName('buttonHand');
      this.originalXPositionGrip = buttonMeshes.grip && buttonMeshes.grip.position.x;
      buttonMeshes.trigger = controllerObject3D.getObjectByName('buttonTrigger');
      this.originalXRotationTrigger = buttonMeshes.trigger && buttonMeshes.trigger.rotation.x;
      buttonMeshes.thumbstick = controllerObject3D.getObjectByName('stick');
      buttonMeshes.xbutton = controllerObject3D.getObjectByName('buttonX');
      buttonMeshes.abutton = controllerObject3D.getObjectByName('buttonA');
      buttonMeshes.ybutton = controllerObject3D.getObjectByName('buttonY');
      buttonMeshes.bbutton = controllerObject3D.getObjectByName('buttonB');
    }

    for (let button in this.buttonMeshes) {
      this.multiMeshFix(button);
    }

    this.applyOffset(evt.detail.model);

    this.el.emit('controllermodelready', {
      name: 'oculus-touch-controls',
      model: this.data.model,
      rayOrigin: this.displayModel[this.data.hand].rayOrigin
    });
  },

  applyOffset (model) {
    model.position.copy(this.displayModel[this.data.hand].modelPivotOffset);
    model.rotation.copy(this.displayModel[this.data.hand].modelPivotRotation);
  },

  multiMeshFix (button) {
    if (!this.buttonMeshes[button]) return;
    this.buttonMeshes[button].traverse((node) => {
      if (node.type !== 'Mesh') return;
      let originalMaterial = node.material;
      this.buttonMeshes[button].naturalColor = originalMaterial.color;
      node.material = new THREE.MeshStandardMaterial(); // {color: originalMaterial.color}

      // preserve details. (not iterable, so we have to use Object.keys.)
      Object.keys(originalMaterial).forEach(key => {
        if (originalMaterial[key] !== node.material[key]) {
          // because A-Frame uses the same single material object for all material nodes, it also uses the
          // same color. This means they use the same color object--we have to break that link. Other links
          // likely also exist, but they don't matter to us, because color is the only one we change.
          node.material[key] = key !== 'color' ? originalMaterial[key] : originalMaterial[key].clone();
        }
      });
      originalMaterial.dispose();
    });
  },

  onModelLoadedV3 (evt) {
    let controllerObject3D = this.controllerObject3D = evt.detail.model;

    if (!this.data.model) { return; }

    let buttonObjects = this.buttonObjects = {};
    let buttonMeshes = this.buttonMeshes = {};
    let buttonRanges = this.buttonRanges = {};

    buttonMeshes.grip = controllerObject3D.getObjectByName('squeeze');
    buttonObjects.grip = controllerObject3D.getObjectByName('xr_standard_squeeze_pressed_value');
    buttonRanges.grip = {
      min: controllerObject3D.getObjectByName('xr_standard_squeeze_pressed_min'),
      max: controllerObject3D.getObjectByName('xr_standard_squeeze_pressed_max')
    };
    buttonObjects.grip.minX = buttonObjects.grip.position.x;

    buttonMeshes.thumbstick = controllerObject3D.getObjectByName('thumbstick');
    buttonObjects.thumbstick = controllerObject3D.getObjectByName('xr_standard_thumbstick_pressed_value');
    buttonRanges.thumbstick = {
      min: controllerObject3D.getObjectByName('xr_standard_thumbstick_pressed_min'),
      max: controllerObject3D.getObjectByName('xr_standard_thumbstick_pressed_max'),
      originalRotation: this.buttonObjects.thumbstick.rotation.clone()
    };
    buttonRanges.thumbstick.pressedY = buttonObjects.thumbstick.position.y;
    buttonRanges.thumbstick.unpressedY =
      buttonRanges.thumbstick.pressedY + Math.abs(buttonRanges.thumbstick.max.position.y) - Math.abs(buttonRanges.thumbstick.min.position.y);

    buttonMeshes.trigger = controllerObject3D.getObjectByName('trigger');
    buttonObjects.trigger = controllerObject3D.getObjectByName('xr_standard_trigger_pressed_value');
    buttonRanges.trigger = {
      min: controllerObject3D.getObjectByName('xr_standard_trigger_pressed_min'),
      max: controllerObject3D.getObjectByName('xr_standard_trigger_pressed_max')
    };
    buttonRanges.trigger.diff = {
      x: Math.abs(buttonRanges.trigger.max.rotation.x) - Math.abs(buttonRanges.trigger.min.rotation.x),
      y: Math.abs(buttonRanges.trigger.max.rotation.y) - Math.abs(buttonRanges.trigger.min.rotation.y),
      z: Math.abs(buttonRanges.trigger.max.rotation.z) - Math.abs(buttonRanges.trigger.min.rotation.z)
    };

    let btn1 = this.data.hand === 'left' ? 'x' : 'a';
    let btn2 = this.data.hand === 'left' ? 'y' : 'b';

    buttonMeshes[btn1 + 'button'] = controllerObject3D.getObjectByName(btn1 + '_button');
    buttonObjects[btn1 + 'button'] = controllerObject3D.getObjectByName(btn1 + '_button_pressed_value');
    buttonRanges[btn1 + 'button'] = {
      min: controllerObject3D.getObjectByName(btn1 + '_button_pressed_min'),
      max: controllerObject3D.getObjectByName(btn1 + '_button_pressed_max')
    };

    buttonMeshes[btn2 + 'button'] = controllerObject3D.getObjectByName(btn2 + '_button');
    buttonObjects[btn2 + 'button'] = controllerObject3D.getObjectByName(btn2 + '_button_pressed_value');
    buttonRanges[btn2 + 'button'] = {
      min: controllerObject3D.getObjectByName(btn2 + '_button_pressed_min'),
      max: controllerObject3D.getObjectByName(btn2 + '_button_pressed_max')
    };

    buttonRanges[btn1 + 'button'].unpressedY = buttonObjects[btn1 + 'button'].position.y;
    buttonRanges[btn1 + 'button'].pressedY =
      buttonRanges[btn1 + 'button'].unpressedY + Math.abs(buttonRanges[btn1 + 'button'].max.position.y) - Math.abs(buttonRanges[btn1 + 'button'].min.position.y);

    buttonRanges[btn2 + 'button'].unpressedY = buttonObjects[btn2 + 'button'].position.y;
    buttonRanges[btn2 + 'button'].pressedY =
      buttonRanges[btn2 + 'button'].unpressedY - Math.abs(buttonRanges[btn2 + 'button'].max.position.y) + Math.abs(buttonRanges[btn2 + 'button'].min.position.y);
  },

  onAxisMoved: function (evt) {
    emitIfAxesChanged(this, this.mapping[this.data.hand].axes, evt);
  },

  onThumbstickMoved: function (evt) {
    if (!this.isV3 || !this.buttonMeshes || !this.buttonMeshes.thumbstick) { return; }
    for (let axis in evt.detail) {
      this.buttonObjects.thumbstick.rotation[this.axisMap[axis]] =
        this.buttonRanges.thumbstick.originalRotation[this.axisMap[axis]] -
        (Math.PI * 1 / 8) *
        evt.detail[axis] *
        (axis === 'y' || this.data.hand === 'right' ? -1 : 1);
    }
  },
  axisMap: {
    y: 'x',
    x: 'z'
  },

  updateModel: function (buttonName, evtName) {
    if (this.data.model) {
      this.updateButtonModel(buttonName, evtName);
    }
  },

  updateButtonModel: function (buttonName, evtName) {
    var button;
    var color = (evtName === 'up' || evtName === 'touchend') ? this.buttonMeshes[buttonName].naturalColor || this.data.buttonColor : evtName === 'touchstart' ? this.data.buttonTouchColor : this.data.buttonHighlightColor;

    if (this.buttonMeshes && this.buttonMeshes[buttonName]) {
      button = this.buttonMeshes[buttonName];
      button.material.color.set(color);
      this.rendererSystem.applyColorCorrection(button.material.color);
    }
  }
});
