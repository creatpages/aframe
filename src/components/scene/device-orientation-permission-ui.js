/* global DeviceOrientationEvent, location  */
let registerComponent = require('../../core/component').registerComponent;
let utils = require('../../utils/');
let bind = utils.bind;

let constants = require('../../constants/');

let MODAL_CLASS = 'a-modal';
let DIALOG_CLASS = 'a-dialog';
let DIALOG_TEXT_CLASS = 'a-dialog-text';
let DIALOG_TEXT_CONTAINER_CLASS = 'a-dialog-text-container';
let DIALOG_BUTTONS_CONTAINER_CLASS = 'a-dialog-buttons-container';
let DIALOG_BUTTON_CLASS = 'a-dialog-button';
let DIALOG_ALLOW_BUTTON_CLASS = 'a-dialog-allow-button';
let DIALOG_DENY_BUTTON_CLASS = 'a-dialog-deny-button';
let DIALOG_OK_BUTTON_CLASS = 'a-dialog-ok-button';

/**
 * UI for enabling device motion permission
 */
module.exports.Component = registerComponent('device-orientation-permission-ui', {
  schema: {
    enabled: {default: true},
    deviceMotionMessage: {
      default: 'This immersive website requires access to your device motion sensors.'
    },
    mobileDesktopMessage: {
      default: 'Set your browser to request the mobile version of the site and reload the page to enjoy immersive mode.'
    },
    httpsMessage: {
      default: 'Access this site over HTTPS to enter VR mode and grant access to the device sensors.'
    },
    denyButtonText: {default: 'Deny'},
    allowButtonText: {default: 'Allow'},
    cancelButtonText: {default: 'Cancel'}
  },

  init: function () {
    let self = this;

    if (!this.data.enabled) { return; }

    if (location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1' &&
        location.protocol === 'http:') {
      this.showHTTPAlert();
    }

    // Show alert on iPad if Safari is on desktop mode.
    if (utils.device.isMobileDeviceRequestingDesktopSite()) {
      this.showMobileDesktopModeAlert();
      return;
    }

    // Browser doesn't support or doesn't require permission to DeviceOrientationEvent API.
    if (typeof DeviceOrientationEvent === 'undefined' || !DeviceOrientationEvent.requestPermission) {
      this.permissionGranted = true;
      return;
    }

    this.onDeviceMotionDialogAllowClicked = bind(this.onDeviceMotionDialogAllowClicked, this);
    this.onDeviceMotionDialogDenyClicked = bind(this.onDeviceMotionDialogDenyClicked, this);
    // Show dialog only if permission has not yet been granted.
    DeviceOrientationEvent.requestPermission().catch(function () {
      self.devicePermissionDialogEl = createPermissionDialog(
        self.data.denyButtonText,
        self.data.allowButtonText,
        self.data.deviceMotionMessage,
        self.onDeviceMotionDialogAllowClicked,
        self.onDeviceMotionDialogDenyClicked);
      self.el.appendChild(self.devicePermissionDialogEl);
    }).then(function () {
      self.el.emit('deviceorientationpermissiongranted');
      self.permissionGranted = true;
    });
  },

  remove: function () {
    // This removes the modal screen
    if (this.devicePermissionDialogEl) { this.el.removeChild(this.devicePermissionDialogEl); }
  },

  onDeviceMotionDialogDenyClicked: function () {
    this.remove();
  },

  showMobileDesktopModeAlert: function () {
    let self = this;
    let safariIpadAlertEl = createAlertDialog(
      self.data.cancelButtonText,
      self.data.mobileDesktopMessage,
      function () { self.el.removeChild(safariIpadAlertEl); });
    this.el.appendChild(safariIpadAlertEl);
  },

  showHTTPAlert: function () {
    let self = this;
    let httpAlertEl = createAlertDialog(
      self.data.cancelButtonText,
      self.data.httpsMessage,
      function () { self.el.removeChild(httpAlertEl); });
    this.el.appendChild(httpAlertEl);
  },

  /**
   * Enable device motion permission when clicked.
   */
  onDeviceMotionDialogAllowClicked: function () {
    let self = this;
    this.el.emit('deviceorientationpermissionrequested');
    DeviceOrientationEvent.requestPermission().then(function (response) {
      if (response === 'granted') {
        self.el.emit('deviceorientationpermissiongranted');
        self.permissionGranted = true;
      } else {
        self.el.emit('deviceorientationpermissionrejected');
      }
      self.remove();
    }).catch(console.error);
  }
});

/**
 * Create a modal dialog that request users permission to access the Device Motion API.
 *
 * @param {function} onAllowClicked - click event handler
 * @param {function} onDenyClicked - click event handler
 *
 * @returns {Element} Wrapper <div>.
 */
function createPermissionDialog (
  denyText, allowText, dialogText, onAllowClicked, onDenyClicked) {
  let buttonsContainer;
  let denyButton;
  let acceptButton;

  buttonsContainer = document.createElement('div');
  buttonsContainer.classList.add(DIALOG_BUTTONS_CONTAINER_CLASS);

  // Buttons
  denyButton = document.createElement('button');
  denyButton.classList.add(DIALOG_BUTTON_CLASS, DIALOG_DENY_BUTTON_CLASS);
  denyButton.setAttribute(constants.AFRAME_INJECTED, '');
  denyButton.innerHTML = denyText;
  buttonsContainer.appendChild(denyButton);

  acceptButton = document.createElement('button');
  acceptButton.classList.add(DIALOG_BUTTON_CLASS, DIALOG_ALLOW_BUTTON_CLASS);
  acceptButton.setAttribute(constants.AFRAME_INJECTED, '');
  acceptButton.innerHTML = allowText;
  buttonsContainer.appendChild(acceptButton);

  // Ask for sensor events to be used
  acceptButton.addEventListener('click', function (evt) {
    evt.stopPropagation();
    onAllowClicked();
  });

  denyButton.addEventListener('click', function (evt) {
    evt.stopPropagation();
    onDenyClicked();
  });

  return createDialog(dialogText, buttonsContainer);
}

function createAlertDialog (closeText, dialogText, onOkClicked) {
  let buttonsContainer;
  let okButton;

  buttonsContainer = document.createElement('div');
  buttonsContainer.classList.add(DIALOG_BUTTONS_CONTAINER_CLASS);

  // Buttons
  okButton = document.createElement('button');
  okButton.classList.add(DIALOG_BUTTON_CLASS, DIALOG_OK_BUTTON_CLASS);
  okButton.setAttribute(constants.AFRAME_INJECTED, '');
  okButton.innerHTML = closeText;
  buttonsContainer.appendChild(okButton);

  // Ask for sensor events to be used
  okButton.addEventListener('click', function (evt) {
    evt.stopPropagation();
    onOkClicked();
  });

  return createDialog(dialogText, buttonsContainer);
}

function createDialog (text, buttonsContainerEl) {
  let modalContainer;
  let dialog;
  let dialogTextContainer;
  let dialogText;

  modalContainer = document.createElement('div');
  modalContainer.classList.add(MODAL_CLASS);
  modalContainer.setAttribute(constants.AFRAME_INJECTED, '');

  dialog = document.createElement('div');
  dialog.className = DIALOG_CLASS;
  dialog.setAttribute(constants.AFRAME_INJECTED, '');
  modalContainer.appendChild(dialog);

  dialogTextContainer = document.createElement('div');
  dialogTextContainer.classList.add(DIALOG_TEXT_CONTAINER_CLASS);
  dialog.appendChild(dialogTextContainer);

  dialogText = document.createElement('div');
  dialogText.classList.add(DIALOG_TEXT_CLASS);
  dialogText.innerHTML = text;
  dialogTextContainer.appendChild(dialogText);

  dialog.appendChild(buttonsContainerEl);

  return modalContainer;
}
