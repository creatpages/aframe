/* global assert, process, setup, suite, test */
let entityFactory = require('../helpers').entityFactory;

suite('visible', function () {
  setup(function (done) {
    let el = this.el = entityFactory();
    el.setAttribute('visible', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });

  suite('update', function () {
    test('treats empty as true', function () {
      let el = this.el;
      el.setAttribute('visible', '');
      assert.ok(el.object3D.visible);
    });

    test('can set to visible', function () {
      let el = this.el;
      el.setAttribute('visible', true);
      assert.ok(el.object3D.visible);
    });

    test('can set to not visible', function () {
      let el = this.el;
      el.setAttribute('visible', false);
      assert.notOk(el.object3D.visible);
    });
  });
});
