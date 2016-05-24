/* global assert, process, setup, suite, test */
'use strict';
var entityFactory = require('../../helpers').entityFactory;
var registerControls = require('core/controls').registerControls;
var THREE = require('index').THREE;

suite('controls', function () {
  var controls;

  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('controls', '');
    el.addEventListener('loaded', function () {
      controls = el.components.controls;
      done();
    });
  });

  suite('init', function () {
    var defaultPositionControls = ['hmd-controls'];
    var defaultRotationControls = ['hmd-controls', 'mouse-controls'];

    test('defaults to include position and rotation controls', function () {
      var data = this.el.getComputedAttribute('controls');
      assert.shallowDeepEqual(data.position, defaultPositionControls);
      assert.shallowDeepEqual(data.rotation, defaultRotationControls);
    });

    test('injects controls components when missing', function () {
      this.el.sceneEl.emit('loaded');
      defaultPositionControls.concat(defaultRotationControls).forEach(function (name) {
        assert.isOk(this.el.components[name]);
      }.bind(this));
    });
  });

  suite('position', function () {
    test('gets active position controls', function () {
      var el = this.el;
      var activeControls;
      registerControls('pos-controls-1', {isVelocityActive: this.sinon.stub().returns(false)});
      registerControls('pos-controls-2', {isVelocityActive: this.sinon.stub().returns(true)});
      el.setAttribute('controls', {position: ['pos-controls-1', 'pos-controls-2']});
      activeControls = controls.getActivePositionControls();
      assert.equal(activeControls.name, 'pos-controls-2');
    });

    test('updates by position delta', function () {
      var el = this.el;
      registerControls('pos-controls-3', {
        isVelocityActive: this.sinon.stub().returns(true),
        getPositionDelta: this.sinon.stub().returns(new THREE.Vector3(1 / 1000, 0, 0))
      });
      el.setAttribute('controls', {position: ['pos-controls-3']});
      controls.tick(0, 1);
      assert.shallowDeepEqual(el.getAttribute('position'), {x: 1 / 1000, y: 0, z: 0});
    });

    test('updates by velocity delta', function () {
      var el = this.el;
      var velocityDelta = new THREE.Vector3();
      registerControls('pos-controls-4', {
        isVelocityActive: this.sinon.stub().returns(false),
        getVelocityDelta: this.sinon.stub().returns(new THREE.Vector3())
      });
      registerControls('pos-controls-5', {
        isVelocityActive: this.sinon.stub().returns(true),
        getVelocityDelta: this.sinon.stub().returns(velocityDelta)
      });
      el.setAttribute('controls', {
        position: ['pos-controls-4', 'pos-controls-5'],
        positionAcceleration: 25
      });
      velocityDelta.set(1, 0, 0);
      controls.tick(0, 1);
      assert.shallowDeepEqual(el.getAttribute('position'), {x: 0.000025, y: 0, z: 0});
    });
  });

  suite('rotation', function () {
    test('gets active rotation controls', function () {
      var el = this.el;
      var activeControls;
      registerControls('rot-controls-1', {isRotationActive: this.sinon.stub().returns(false)});
      registerControls('rot-controls-2', {isRotationActive: this.sinon.stub().returns(true)});
      registerControls('rot-controls-3', {isRotationActive: this.sinon.stub().returns(true)});
      el.setAttribute('controls', {
        rotation: ['rot-controls-1', 'rot-controls-2', 'rot-controls-3']
      });
      activeControls = controls.getActiveRotationControls();
      assert.equal(activeControls.name, 'rot-controls-2');
    });

    test('updates rotation', function () {
      var el = this.el;
      var rotation = new THREE.Vector3();
      registerControls('rot-controls-4', {
        isRotationActive: this.sinon.stub().returns(false),
        getRotation: this.sinon.stub().returns(new THREE.Vector3())
      });
      registerControls('rot-controls-5', {
        isRotationActive: this.sinon.stub().returns(true),
        getRotation: this.sinon.stub().returns(rotation)
      });
      el.setAttribute('controls', {
        rotation: ['rot-controls-4', 'rot-controls-5']
      });
      rotation.set(45, 180, 0);
      controls.tick(0, 1);
      assert.shallowDeepEqual(el.getAttribute('rotation'), {x: 45, y: 180, z: 0});
    });

    test('updates rotation delta', function () {
      var el = this.el;
      var rotationDelta = new THREE.Vector2();
      registerControls('rot-controls-6', {
        isRotationActive: this.sinon.stub().returns(false),
        getRotationDelta: this.sinon.stub().returns(new THREE.Vector2())
      });
      registerControls('rot-controls-7', {
        isRotationActive: this.sinon.stub().returns(true),
        getRotationDelta: this.sinon.stub().returns(rotationDelta)
      });
      el.setAttribute('controls', {
        rotation: ['rot-controls-6', 'rot-controls-7']
      });
      rotationDelta.set(Math.PI / 4, -1 * Math.PI / 8);
      controls.tick(0, 1);
      assert.shallowDeepEqual(el.getAttribute('rotation'), {x: 22.5, y: -45, z: 0});
    });
  });
});
