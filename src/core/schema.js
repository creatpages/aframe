var debug = require('../utils/debug');
var propertyTypes = require('./propertyTypes').propertyTypes;
var warn = debug('core:schema:warn');

/**
 * A schema is classified as a schema for a single property if:
 * - `type` is defined on the schema as a string.
 * - OR `default` is defined on the schema, as a reserved keyword.
 * - OR schema is empty.
 */
function isSingleProperty (schema) {
  if ('type' in schema) {
    return typeof schema.type === 'string';
  }
  return 'default' in schema;
}
module.exports.isSingleProperty = isSingleProperty;

/**
 * Build step to schema to use `type` to inject default value, parser, and stringifier.
 *
 * @param {object} schema
 * @returns {object} Schema.
 */
module.exports.process = function (schema) {
  // For single property schema, run processPropDefinition over the whole schema.
  if (isSingleProperty(schema)) {
    return processPropertyDefinition(schema);
  }

  // For multi-property schema, run processPropDefinition over each property definition.
  Object.keys(schema).forEach(function (propName) {
    schema[propName] = processPropertyDefinition(schema[propName]);
  });
  return schema;
};

/**
 * Inject default value, parser, stringifier for single property.
 */
function processPropertyDefinition (propDefinition) {
  var defaultVal = propDefinition.default;
  var propType;
  var typeName = propDefinition.type;

  // Type inference.
  if (!propDefinition.type) {
    if (defaultVal !== undefined && ['boolean', 'number'].indexOf(typeof defaultVal) !== -1) {
      // Type inference.
      typeName = typeof defaultVal;
    } else if (Array.isArray(defaultVal)) {
      typeName = 'array';
    } else {
      // Fall back to string.
      typeName = 'string';
    }
  } else if (propDefinition.type === 'bool') {
    typeName = 'boolean';
  } else if (propDefinition.type === 'float') {
    typeName = 'number';
  }

  propType = propertyTypes[typeName];
  if (!propType) {
    warn('Unknown property type: ' + typeName);
  }

  // Fill in parse and stringify using property types.
  propDefinition.parse = propDefinition.parse || propType.parse;
  propDefinition.stringify = propDefinition.stringify || propType.stringify;

  // Fill in type name.
  propDefinition.type = typeName;

  // Check if default value exists.
  if ('default' in propDefinition) {
    // Check if default values are valid
    if (!isValidDefaultValue(typeName, defaultVal)) {
      warn('The default value: ' + '"' + defaultVal + '"' + ' does not match the type: ' + typeName);
    }
  } else {
    // Fill in default value.
    propDefinition.default = propType.default;
  }

  return propDefinition;
}
module.exports.processPropertyDefinition = processPropertyDefinition;

/**
 * Parse propData using schema. Use default values if not existing in propData.
 *
 * @param {object} propData - Unparsed properties.
 * @param {object} schema - Property types definition.
 * @param {boolean} getPartialData - Whether to return full component data or just the data
 *        with keys in `propData`.
 * @param {string } componentName - Name of the component, used for the property warning.
 * @param {boolean} silent - Suppress warning messages.
 */
module.exports.parseProperties = function (propData, schema, getPartialData, componentName,
                                           silent) {
  var propNames = Object.keys(getPartialData ? propData : schema);

  if (propData === null || typeof propData !== 'object') { return propData; }

  // Validation errors.
  Object.keys(propData).forEach(function (propName) {
    if (!schema[propName] && !silent) {
      warn('Unknown property `' + propName +
           '` for component/system `' + componentName + '`.');
    }
  });

  propNames.forEach(function parse (propName) {
    var propDefinition = schema[propName];
    var propValue = propData[propName];
    if (!(schema[propName])) { return; }
    propData[propName] = parseProperty(propValue, propDefinition);
  });

  return propData;
};

/**
 * Deserialize a single property.
 */
function parseProperty (value, propDefinition) {
  // Use default value if value is falsy.
  if (value === undefined || value === null || value === '') {
    value = propDefinition.default;
  }
  // Invoke property type parser.
  return propDefinition.parse(value, propDefinition.default);
}
module.exports.parseProperty = parseProperty;

/**
 * Serialize a group of properties.
 */
module.exports.stringifyProperties = function (propData, schema) {
  var stringifiedData = {};
  Object.keys(propData).forEach(function (propName) {
    var propDefinition = schema[propName];
    var propValue = propData[propName];
    var value = propValue;
    if (typeof value === 'object') {
      value = stringifyProperty(propValue, propDefinition);
      if (!propDefinition) { warn('Unknown component property: ' + propName); }
    }
    stringifiedData[propName] = value;
  });
  return stringifiedData;
};

/**
 * Serialize a single property.
 */
function stringifyProperty (value, propDefinition) {
  // This function stringifies but it's used in a context where
  // there's always second stringification pass. By returning the original
  // value when it's not an object we save one unnecessary call
  // to JSON.stringify.
  if (typeof value !== 'object') { return value; }
  // if there's no schema for the property we use standar JSON stringify
  if (!propDefinition || value === null) { return JSON.stringify(value); }
  return propDefinition.stringify(value);
}
module.exports.stringifyProperty = stringifyProperty;

/**
 * Checks if Valid default coordinates
 * @param {unknown} possibleCoordinates
 * @param {number} dimensions - 2 for 2D Vector or 3 for 3D vector
 * @returns {boolean} A boolean determining if coordinates are parsed correctly.
 */
function isValidDefaultCoordinate (possibleCoordinates, dimensions) {
  if (typeof possibleCoordinates !== 'object' || possibleCoordinates === null) {
    return false;
  } else if (Object.keys(possibleCoordinates).length !== dimensions) {
    return false;
  } else {
    if (dimensions === 2 && (possibleCoordinates.x === 0 || possibleCoordinates.x) && (possibleCoordinates.y === 0 || possibleCoordinates.y)) {
      if (typeof possibleCoordinates.x === 'number' && typeof possibleCoordinates.y === 'number') {
        return true;
      }
    }
    if (dimensions === 3 && (possibleCoordinates.x === 0 || possibleCoordinates.x) && (possibleCoordinates.y === 0 || possibleCoordinates.y) && (possibleCoordinates.z === 0 || possibleCoordinates.z)) {
      if (typeof possibleCoordinates.x === 'number' && typeof possibleCoordinates.y === 'number' && typeof possibleCoordinates.z === 'number') {
        return true;
      }
    }
    if (dimensions === 4 && (possibleCoordinates.x === 0 || possibleCoordinates.x) && (possibleCoordinates.y === 0 || possibleCoordinates.y) && (possibleCoordinates.z === 0 || possibleCoordinates.z) && (possibleCoordinates.w === 0 || possibleCoordinates.w)) {
      if (typeof possibleCoordinates.x === 'number' && typeof possibleCoordinates.y === 'number' && typeof possibleCoordinates.z === 'number' && typeof possibleCoordinates.w === 'number') {
        return true;
      }
    }
  }

  return false;
}
module.exports.isValidDefaultCoordinate = isValidDefaultCoordinate;

/**
 * Validates the default values in a schema
 * @param {string} type - type in a prop
 * @param {unknown} defaultVal - default in a prop
 * @returns {boolean} A boolean determining if defaults are valid.
 */
function isValidDefaultValue (type, defaultVal) {
  if (type === 'audio' && typeof defaultVal !== 'string') { return false; }
  if (type === 'array' && !Array.isArray(defaultVal)) { return false; }
  if (type === 'asset' && typeof defaultVal !== 'string') { return false; }
  if (type === 'boolean' && typeof defaultVal !== 'boolean') { return false; }
  if (type === 'color' && typeof defaultVal !== 'string') { return false; }
  if (type === 'int' && typeof defaultVal !== 'number') { return false; }
  if (type === 'number' && typeof defaultVal !== 'number') { return false; }
  if (type === 'map' && typeof defaultVal !== 'string') { return false; }
  if (type === 'model' && typeof defaultVal !== 'string') { return false; }
  if (type === 'selector' && typeof defaultVal !== 'string') { return false; }
  if (type === 'selectorAll' && typeof defaultVal !== 'string') { return false; }
  if (type === 'src' && typeof defaultVal !== 'string') { return false; }
  if (type === 'string' && typeof defaultVal !== 'string') { return false; }
  if (type === 'time' && typeof defaultVal !== 'number') { return false; }
  if (type === 'vec2') { return isValidDefaultCoordinate(defaultVal, 2); }
  if (type === 'vec3') { return isValidDefaultCoordinate(defaultVal, 3); }
  if (type === 'vec4') { return isValidDefaultCoordinate(defaultVal, 4); }

  return true;
}
module.exports.isValidDefaultValue = isValidDefaultValue;
