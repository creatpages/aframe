var registerSystem = require('../core/system').registerSystem;

/**
 * WebXR session initialization and XR module support.
 */
module.exports.System = registerSystem('webxr', {
  schema: {
    requiredFeatures: {type: 'array', default: ['local-floor']},
    optionalFeatures: {type: 'array', default: ['bounded-floor']},
    overlayElement: {type: 'selector'}
  },

  update: function () {
    var data =  this.data;
    this.sessionConfiguration = {
      requiredFeatures: data.requiredFeatures,
      optionalFeatures: data.optionalFeatures
    }

    if (data.overlayElement) {
      this.warnIfFeatureNotRequested('dom-overlay');
      this.sessionConfiguration.domOverlay = {root: data.overlayElement};
    }
  },

  wasFeatureRequested: function (feature) {
    // Features available by default for immersive sessions don't need to
    // be requested explicitly.
    if (feature == 'viewer' || feature == 'local') return true;

    if (this.sessionConfiguration.requiredFeatures.includes(feature) ||
        this.sessionConfiguration.requiredFeatures.includes(feature)) {
      return true;
    }

    return false;
  },

  warnIfFeatureNotRequested: function (feature, opt_intro) {
    if (!this.wasFeatureRequested(feature)) {
      var msg = "Please add the feature '" + feature + "' to a-scene's " +
          "webxr system options in requiredFeatures/optionalFeatures.";
      console.warn((opt_intro ? opt_intro + ' ' : '') + msg);
    }
  }
});
