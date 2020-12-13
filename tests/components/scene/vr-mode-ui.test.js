/* global assert, process, setup, suite, test */
let entityFactory = require('../../helpers').entityFactory;
let utils = require('index').utils;

let UI_CLASSES = ['.a-orientation-modal', '.a-enter-vr-button'];

suite('vr-mode-ui', function () {
  setup(function (done) {
    this.entityEl = entityFactory();
    let el = this.el = this.entityEl.parentNode;
    this.sinon.stub(utils.device, 'getVRDisplay').returns({
      requestPresent: function () {
        return Promise.resolve();
      }
    });
    el.addEventListener('loaded', function () { done(); });
  });

  test('appends UI', function () {
    let scene = this.el;
    UI_CLASSES.forEach(function (uiClass) {
      assert.equal(scene.querySelectorAll(uiClass).length, 1);
    });
  });

  test('can disable UI', function () {
    let scene = this.el;
    scene.setAttribute('vr-mode-ui', 'enabled', false);
    UI_CLASSES.forEach(function (uiClass) {
      assert.notOk(scene.querySelector(uiClass));
    });
  });

  test('hides on enter VR', function () {
    let scene = this.el;
    // mock camera
    scene.camera = {el: {object3D: {}}};
    scene.enterVR();
    UI_CLASSES.forEach(function (uiClass) {
      assert.ok(scene.querySelector(uiClass).className.indexOf('a-hidden'));
    });
  });

  test('shows on exit VR', function (done) {
    let scene = this.el;
    // mock camera
    scene.camera = {
      el: {object3D: {}, getAttribute: function () { return {spectator: false}; }},
      updateProjectionMatrix: function () {}
    };
    scene.enterVR();
    scene.exitVR();

    process.nextTick(function () {
      assert.equal(scene.querySelector('.a-enter-vr-button').className.indexOf('a-hidden'),
                   -1);
      done();
    });
  });
});
