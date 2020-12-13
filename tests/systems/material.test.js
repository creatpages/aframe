/* global assert, process, setup, suite, test, AFRAME, THREE */
let entityFactory = require('../helpers').entityFactory;

let IMAGE1 = 'base/tests/assets/test.png';
let IMAGE2 = 'base/tests/assets/test2.png';
let VIDEO1 = 'base/tests/assets/test.mp4';
let VIDEO2 = 'base/tests/assets/test2.mp4';

suite('material system', function () {
  setup(function (done) {
    let self = this;
    let el = this.el = entityFactory();
    el.addEventListener('loaded', function () {
      self.system = el.sceneEl.systems.material;
      done();
    });
  });

  suite('registerMaterial', function () {
    test('registers material to scene', function () {
      let el = this.el;
      let material;
      let system;
      el.setAttribute('geometry', '');
      el.setAttribute('material', '');
      system = el.components.material.system;
      material = el.getObject3D('mesh').material;
      assert.equal(system.materials[material.uuid], material);
    });

    test('re-registers material when toggling material to flat shading', function () {
      let el = this.el;
      let oldMaterial;
      let newMaterial;
      let system;
      el.setAttribute('geometry', '');
      el.setAttribute('material', 'shader: flat');
      oldMaterial = el.getObject3D('mesh').material;
      el.setAttribute('material', 'shader: standard');
      system = el.components.material.system;
      newMaterial = el.getObject3D('mesh').material;
      assert.notOk(system.materials[oldMaterial.uuid]);
      assert.equal(system.materials[newMaterial.uuid], newMaterial);
    });
  });

  suite('unregisterMaterial', function () {
    test('disposes of unused textures', function () {
      let el = this.el;
      let sinon = this.sinon;
      let system = el.sceneEl.systems.material;
      let texture1 = {uuid: 'tex1', isTexture: true, dispose: sinon.spy()};
      let texture2 = {uuid: 'tex2', isTexture: true, dispose: sinon.spy()};
      let material1 = {fooMap: texture1, barMap: texture2, dispose: sinon.spy()};
      let material2 = {fooMap: texture1, dispose: sinon.spy()};

      el.emit('materialtextureloaded', {texture: texture1});
      el.emit('materialtextureloaded', {texture: texture1});
      el.emit('materialtextureloaded', {texture: texture2});

      system.unregisterMaterial(material1);
      assert.notOk(texture1.dispose.called);
      assert.ok(texture2.dispose.called);

      system.unregisterMaterial(material2);
      assert.ok(texture1.dispose.called);
      assert.equal(texture2.dispose.callCount, 1);
    });
  });

  suite('texture caching', function () {
    setup(function () {
      this.system.clearTextureCache();
    });

    suite('loadImage', function () {
      test('loads image texture', function (done) {
        let system = this.system;
        let src = IMAGE1;
        let data = {src: IMAGE1};
        let hash = system.hash(data);

        system.loadImage(src, data, function (texture) {
          system.textureCache[hash].then(function (texture2) {
            assert.equal(texture, texture2);
            done();
          });
        });
      });

      test('loads image given an <img> element', function (done) {
        let img = document.createElement('img');
        let system = this.system;
        let data = {src: IMAGE1};
        let hash = system.hash(data);

        img.setAttribute('src', IMAGE1);
        system.loadImage(img, data, function (texture) {
          assert.equal(texture.image, img);
          system.textureCache[hash].then(function (texture2) {
            assert.equal(texture, texture2);
            done();
          });
        });
      });

      test('caches identical image textures', function (done) {
        let system = this.system;
        let src = IMAGE1;
        let data = {src: src};
        let hash = system.hash(data);

        Promise.all([
          new Promise(function (resolve) { system.loadImage(src, data, resolve); }),
          new Promise(function (resolve) { system.loadImage(src, data, resolve); })
        ]).then(function (results) {
          assert.equal(results[0], results[1]);
          assert.ok(system.textureCache[hash]);
          assert.equal(Object.keys(system.textureCache).length, 1);
          done();
        });
      });

      test('caches different textures for different images', function (done) {
        let system = this.system;
        let src1 = IMAGE1;
        let src2 = IMAGE2;
        let data1 = {src: src1};
        let data2 = {src: src2};

        Promise.all([
          new Promise(function (resolve) { system.loadImage(src1, data1, resolve); }),
          new Promise(function (resolve) { system.loadImage(src2, data2, resolve); })
        ]).then(function (results) {
          assert.notEqual(results[0].uuid, results[1].uuid);
          done();
        });
      });

      test('caches different textures for different repeat', function (done) {
        let system = this.system;
        let src = IMAGE1;
        let data1 = {src: src};
        let data2 = {src: src, repeat: {x: 5, y: 5}};
        let hash1 = system.hash(data1);
        let hash2 = system.hash(data2);

        Promise.all([
          new Promise(function (resolve) { system.loadImage(src, data1, resolve); }),
          new Promise(function (resolve) { system.loadImage(src, data2, resolve); })
        ]).then(function (results) {
          assert.notEqual(results[0].uuid, results[1].uuid);
          assert.shallowDeepEqual(results[0].repeat, {x: 1, y: 1});
          assert.shallowDeepEqual(results[1].repeat, {x: 5, y: 5});
          assert.equal(Object.keys(system.textureCache).length, 2);
          assert.ok(system.textureCache[hash1]);
          assert.ok(system.textureCache[hash2]);
          done();
        });
      });
    });

    suite('loadVideo', function () {
      test('loads video texture', function (done) {
        let system = this.system;
        let src = VIDEO1;
        let data = {src: VIDEO1};

        system.loadVideo(src, data, function (texture) {
          let hash = Object.keys(system.textureCache)[0];
          system.textureCache[hash].then(function (result) {
            assert.equal(texture, result.texture);
            assert.equal(texture.image, result.videoEl);
            done();
          });
        });
      });

      test('loads image given a <video> element', function (done) {
        let videoEl = document.createElement('video');
        let system = this.system;
        let data = {src: VIDEO1};

        videoEl.setAttribute('src', VIDEO1);
        system.loadVideo(videoEl, data, function (texture) {
          let hash = Object.keys(system.textureCache)[0];
          assert.equal(texture.image, videoEl);
          system.textureCache[hash].then(function (result) {
            assert.equal(texture, result.texture);
            assert.equal(texture.image, result.videoEl);
            done();
          });
        });
      });

      test('loads image given a <video> element with <source>', function (done) {
        let videoEl = document.createElement('video');
        let system = this.system;
        let data = {};

        videoEl.insertAdjacentHTML('beforeend',
          '<source src="' + VIDEO1 + '"></source>');
        system.loadVideo(videoEl, data, function (texture) {
          let hash = Object.keys(system.textureCache)[0];
          assert.equal(texture.image, videoEl);
          system.textureCache[hash].then(function (result) {
            assert.equal(texture, result.texture);
            assert.equal(texture.image, result.videoEl);
            done();
          });
        });
      });

      test('sets texture flags appropriately when given a <video> element that isHLS on iOS', function (done) {
        let videoEl = document.createElement('video');
        let system = this.system;
        let data = {src: VIDEO1};

        // Mock iOS.
        let sceneEl = this.el.sceneEl;
        let realIsIOS = sceneEl.isIOS;
        sceneEl.isIOS = true;
        assert.equal(sceneEl.isIOS, true);

        // Set up and verify video element to be treated as HLS.
        videoEl.setAttribute('src', VIDEO1);
        videoEl.setAttribute('type', 'application/x-mpegurl');
        assert.equal(AFRAME.utils.material.isHLS(videoEl.getAttribute('src'), videoEl.getAttribute('type')), true);

        system.loadVideo(videoEl, data, function (texture) {
          assert.equal(texture.image, videoEl);

          // Verify system thought this was iOS HLS.
          assert.equal(sceneEl.isIOS, true);
          assert.equal(AFRAME.utils.material.isHLS(videoEl.getAttribute('src'), videoEl.getAttribute('type')), true);

          // Undo mock of iOS.
          sceneEl.isIOS = realIsIOS;

          // Verify iOS HLS flags from systems/material.js have been applied.
          assert.equal(texture.format, THREE.RGBAFormat);
          assert.equal(texture.needsCorrectionBGRA, true);
          assert.equal(texture.flipY, false);
          assert.equal(texture.needsCorrectionFlipY, true);
          done();
        });
      });

      test('caches identical video textures', function (done) {
        let system = this.system;
        let src = VIDEO1;
        let data = {src: src};

        Promise.all([
          new Promise(function (resolve) { system.loadVideo(src, data, resolve); }),
          new Promise(function (resolve) { system.loadVideo(src, data, resolve); })
        ]).then(function (results) {
          assert.equal(results[0], results[1]);
          assert.equal(Object.keys(system.textureCache).length, 1);
          done();
        });
      });

      test('caches different textures for different videos', function (done) {
        let system = this.system;
        let src1 = VIDEO1;
        let src2 = VIDEO2;
        let data1 = {src: src1};
        let data2 = {src: src2};

        Promise.all([
          new Promise(function (resolve) { system.loadVideo(src1, data1, resolve); }),
          new Promise(function (resolve) { system.loadVideo(src2, data2, resolve); })
        ]).then(function (results) {
          assert.notEqual(results[0].uuid, results[1].uuid);
          done();
        });
      });

      test('caches different textures for different repeat', function (done) {
        let system = this.system;
        let src = VIDEO1;
        let data1 = {src: src};
        let data2 = {src: src, repeat: {x: 5, y: 5}};

        Promise.all([
          new Promise(function (resolve) { system.loadVideo(src, data1, resolve); }),
          new Promise(function (resolve) { system.loadVideo(src, data2, resolve); })
        ]).then(function (results) {
          assert.notEqual(results[0].uuid, results[1].uuid);
          assert.shallowDeepEqual(results[0].repeat, {x: 1, y: 1});
          assert.shallowDeepEqual(results[1].repeat, {x: 5, y: 5});
          assert.equal(Object.keys(system.textureCache).length, 2);
          done();
        });
      });
    });
  });
});
