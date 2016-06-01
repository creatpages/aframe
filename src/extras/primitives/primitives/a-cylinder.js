var registerPrimitive = require('../registerPrimitive');

registerPrimitive('a-cylinder', {
  includeMeshProperties: true,

  defaultComponents: {
    geometry: {primitive: 'cylinder'}
  },

  mappings: {
    height: 'geometry.height',
    'open-ended': 'geometry.openEnded',
    radius: 'geometry.radius',
    'radius-bottom': 'geometry.radiusBottom',
    'radius-top': 'geometry.radiusTop',
    'segments-radial': 'geometry.segmentsRadial',
    'theta-length': 'geometry.thetaLength',
    'theta-start': 'geometry.thetaStart'
  }
});
