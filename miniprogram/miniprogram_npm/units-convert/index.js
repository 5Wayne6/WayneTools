module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1706713715963, function(require, module, exports) {
var __TEMP__ = require('decimal.js');var Decimal = __REQUIRE_DEFAULT__(__TEMP__);

var convert,
  keys = require('lodash.keys'),
  each = require('lodash.foreach'),
  measures = {
    length: require('./definitions/length'),
    area: require('./definitions/area'),
    mass: require('./definitions/mass'),
    volume: require('./definitions/volume'),
    each: require('./definitions/each'),
    temperature: require('./definitions/temperature'),
    time: require('./definitions/time'),
    digital: require('./definitions/digital'),
    partsPer: require('./definitions/partsPer'),
    speed: require('./definitions/speed'),
    pace: require('./definitions/pace'),
    pressure: require('./definitions/pressure'),
    current: require('./definitions/current'),
    voltage: require('./definitions/voltage'),
    power: require('./definitions/power'),
    reactivePower: require('./definitions/reactivePower'),
    apparentPower: require('./definitions/apparentPower'),
    energy: require('./definitions/energy'),
    reactiveEnergy: require('./definitions/reactiveEnergy'),
    volumeFlowRate: require('./definitions/volumeFlowRate'),
    illuminance: require('./definitions/illuminance'),
    frequency: require('./definitions/frequency'),
    angle: require('./definitions/angle'),
    charge: require('./definitions/charge'),
    force: require('./definitions/force'),
    massFlowRate: require('./definitions/massFlowRate'),
    pieces: require('./definitions/pieces'),
  },
  Converter

Converter = function (numerator, denominator) {
  if (denominator) this.val = numerator / denominator
  else this.val = numerator
}

/**
 * Lets the converter know the source unit abbreviation
 */
Converter.prototype.from = function (from) {
  if (this.destination) throw new Error('.from must be called before .to')

  this.origin = this.getUnit(from)

  if (!this.origin) {
    this.throwUnsupportedUnitError(from)
  }

  return this
}

/**
 * Converts the unit and returns the value
 */
Converter.prototype.to = function (to) {
  if (!this.origin) throw new Error('.to must be called after .from')

  this.destination = this.getUnit(to)

  var result, transform

  if (!this.destination) {
    this.throwUnsupportedUnitError(to)
  }

  // Don't change the value if origin and destination are the same
  if (this.origin.abbr === this.destination.abbr) {
    return this.val
  }

  // You can't go from liquid to mass, for example
  if (this.destination.measure != this.origin.measure) {
    throw new Error(
      'Cannot convert incompatible measures of ' +
        this.destination.measure +
        ' and ' +
        this.origin.measure,
    )
  }

  /**
   * Convert from the source value to its anchor inside the system
   */
  // result = this.val * this.origin.unit.to_anchor
  result = new Decimal(this.val).times(this.origin.unit.to_anchor).toNumber()

  /**
   * For some changes it's a simple shift (C to K)
   * So we'll add it when convering into the unit (later)
   * and subtract it when converting from the unit
   */
  if (this.origin.unit.anchor_shift) {
    // result -= this.origin.unit.anchor_shift
    result = new Decimal(result).minus(this.origin.unit.anchor_shift).toNumber()
  }

  /**
   * Convert from one system to another through the anchor ratio. Some conversions
   * aren't ratio based or require more than a simple shift. We can provide a custom
   * transform here to provide the direct result
   */
  if (this.origin.system != this.destination.system) {
    transform =
      measures[this.origin.measure]._anchors[this.origin.system].transform
    if (typeof transform === 'function') {
      result = transform(result)
    } else {
      // result *= measures[this.origin.measure]._anchors[this.origin.system].ratio
      result = new Decimal(result)
        .times(measures[this.origin.measure]._anchors[this.origin.system].ratio)
        .toNumber()
    }
  }

  /**
   * This shift has to be done after the system conversion business
   */
  if (this.destination.unit.anchor_shift) {
    // result += this.destination.unit.anchor_shift
		result = new Decimal(result).plus(this.destination.unit.anchor_shift).toNumber()
  }

  /**
   * Convert to another unit inside the destination system
   */
  // return result / this.destination.unit.to_anchor
	return new Decimal(result).div(this.destination.unit.to_anchor).toNumber()
}

/**
 * Converts the unit to the best available unit.
 */
Converter.prototype.toBest = function (options) {
  if (!this.origin) throw new Error('.toBest must be called after .from')

  var options = Object.assign(
    {
      exclude: [],
      cutOffNumber: 1,
    },
    options,
  )

  var best
  /**
    Looks through every possibility for the 'best' available unit.
    i.e. Where the value has the fewest numbers before the decimal point,
    but is still higher than 1.
  */
  each(
    this.possibilities(),
    function (possibility) {
      var unit = this.describe(possibility)
      var isIncluded = options.exclude.indexOf(possibility) === -1

      if (isIncluded && unit.system === this.origin.system) {
        var result = this.to(possibility)
        if (!best || (result >= options.cutOffNumber && result < best.val)) {
          best = {
            val: result,
            unit: possibility,
            singular: unit.singular,
            plural: unit.plural,
          }
        }
      }
    }.bind(this),
  )

  return best
}

/**
 * Finds the unit
 */
Converter.prototype.getUnit = function (abbr) {
  var found

  each(measures, function (systems, measure) {
    each(systems, function (units, system) {
      if (system == '_anchors') return false

      each(units, function (unit, testAbbr) {
        if (testAbbr == abbr) {
          found = {
            abbr: abbr,
            measure: measure,
            system: system,
            unit: unit,
          }
          return false
        }
      })

      if (found) return false
    })

    if (found) return false
  })

  return found
}

var describe = function (resp) {
  return {
    abbr: resp.abbr,
    measure: resp.measure,
    system: resp.system,
    singular: resp.unit.name.singular,
    plural: resp.unit.name.plural,
  }
}

/**
 * An alias for getUnit
 */
Converter.prototype.describe = function (abbr) {
  var resp = Converter.prototype.getUnit(abbr)
  var desc = null

  try {
    desc = describe(resp)
  } catch (err) {
    this.throwUnsupportedUnitError(abbr)
  }

  return desc
}

/**
 * Detailed list of all supported units
 */
Converter.prototype.list = function (measure) {
  var list = []

  each(measures, function (systems, testMeasure) {
    if (measure && measure !== testMeasure) return

    each(systems, function (units, system) {
      if (system == '_anchors') return false

      each(units, function (unit, abbr) {
        list = list.concat(
          describe({
            abbr: abbr,
            measure: testMeasure,
            system: system,
            unit: unit,
          }),
        )
      })
    })
  })

  return list
}

Converter.prototype.throwUnsupportedUnitError = function (what) {
  var validUnits = []

  each(measures, function (systems, measure) {
    each(systems, function (units, system) {
      if (system == '_anchors') return false

      validUnits = validUnits.concat(keys(units))
    })
  })

  throw new Error(
    'Unsupported unit ' + what + ', use one of: ' + validUnits.join(', '),
  )
}

/**
 * Returns the abbreviated measures that the value can be
 * converted to.
 */
Converter.prototype.possibilities = function (measure) {
  var possibilities = []
  if (!this.origin && !measure) {
    each(keys(measures), function (measure) {
      each(measures[measure], function (units, system) {
        if (system == '_anchors') return false

        possibilities = possibilities.concat(keys(units))
      })
    })
  } else {
    measure = measure || this.origin.measure
    each(measures[measure], function (units, system) {
      if (system == '_anchors') return false

      possibilities = possibilities.concat(keys(units))
    })
  }

  return possibilities
}

/**
 * Returns the abbreviated measures that the value can be
 * converted to.
 */
Converter.prototype.measures = function () {
  return keys(measures)
}

convert = function (value) {
  return new Converter(value)
}

if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });exports.default = convert;

}, function(modId) {var map = {"./definitions/length":1706713715964,"./definitions/area":1706713715965,"./definitions/mass":1706713715966,"./definitions/volume":1706713715967,"./definitions/each":1706713715968,"./definitions/temperature":1706713715969,"./definitions/time":1706713715970,"./definitions/digital":1706713715971,"./definitions/partsPer":1706713715972,"./definitions/speed":1706713715973,"./definitions/pace":1706713715974,"./definitions/pressure":1706713715975,"./definitions/current":1706713715976,"./definitions/voltage":1706713715977,"./definitions/power":1706713715978,"./definitions/reactivePower":1706713715979,"./definitions/apparentPower":1706713715980,"./definitions/energy":1706713715981,"./definitions/reactiveEnergy":1706713715982,"./definitions/volumeFlowRate":1706713715983,"./definitions/illuminance":1706713715984,"./definitions/frequency":1706713715985,"./definitions/angle":1706713715986,"./definitions/charge":1706713715987,"./definitions/force":1706713715988,"./definitions/massFlowRate":1706713715989,"./definitions/pieces":1706713715990}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715964, function(require, module, exports) {
var metric, imperial

metric = {
  nm: {
    name: {
      singular: 'Nanometer',
      plural: 'Nanometers',
    },
    to_anchor: 1e-9,
  },
  μm: {
    name: {
      singular: 'Micrometer',
      plural: 'Micrometers',
    },
    to_anchor: 1e-6,
  },
  mm: {
    name: {
      singular: 'Millimeter',
      plural: 'Millimeters',
    },
    to_anchor: 1e-3,
  },
  cm: {
    name: {
      singular: 'Centimeter',
      plural: 'Centimeters',
    },
    to_anchor: 1e-2,
  },
  m: {
    name: {
      singular: 'Meter',
      plural: 'Meters',
    },
    to_anchor: 1,
  },
  km: {
    name: {
      singular: 'Kilometer',
      plural: 'Kilometers',
    },
    to_anchor: 1e3,
  },
}

imperial = {
  mil: {
    name: {
      singular: 'Mil',
      plural: 'Mils',
    },
    to_anchor: 1 / 12000,
  },
  in: {
    name: {
      singular: 'Inch',
      plural: 'Inches',
    },
    to_anchor: 1 / 12,
  },
  yd: {
    name: {
      singular: 'Yard',
      plural: 'Yards',
    },
    to_anchor: 3,
  },
  'ft-us': {
    name: {
      singular: 'US Survey Foot',
      plural: 'US Survey Feet',
    },
    to_anchor: 1.000002,
  },
  ft: {
    name: {
      singular: 'Foot',
      plural: 'Feet',
    },
    to_anchor: 1,
  },
  fathom: {
    name: {
      singular: 'Fathom',
      plural: 'Fathoms',
    },
    to_anchor: 6,
  },
  mi: {
    name: {
      singular: 'Mile',
      plural: 'Miles',
    },
    to_anchor: 5280,
  },
  nMi: {
    name: {
      singular: 'Nautical Mile',
      plural: 'Nautical Miles',
    },
    to_anchor: 6076.12,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'm',
      ratio: 3.28084,
    },
    imperial: {
      unit: 'ft',
      ratio: 1 / 3.28084,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715965, function(require, module, exports) {
var metric, imperial

metric = {
  nm2: {
    name: {
      singular: 'Square Nanometer',
      plural: 'Square Nanometers',
    },
    to_anchor: 1e-18,
  },
  μm2: {
    name: {
      singular: 'Square Micrometer',
      plural: 'Square Micrometers',
    },
    to_anchor: 1e-12,
  },
  mm2: {
    name: {
      singular: 'Square Millimeter',
      plural: 'Square Millimeters',
    },
    to_anchor: 1 / 1000000,
  },
  cm2: {
    name: {
      singular: 'Square Centimeter',
      plural: 'Square Centimeters',
    },
    to_anchor: 1 / 10000,
  },
  m2: {
    name: {
      singular: 'Square Meter',
      plural: 'Square Meters',
    },
    to_anchor: 1,
  },
  ha: {
    name: {
      singular: 'Hectare',
      plural: 'Hectares',
    },
    to_anchor: 10000,
  },
  km2: {
    name: {
      singular: 'Square Kilometer',
      plural: 'Square Kilometers',
    },
    to_anchor: 1000000,
  },
}

imperial = {
  in2: {
    name: {
      singular: 'Square Inch',
      plural: 'Square Inches',
    },
    to_anchor: 1 / 144,
  },
  yd2: {
    name: {
      singular: 'Square Yard',
      plural: 'Square Yards',
    },
    to_anchor: 9,
  },
  ft2: {
    name: {
      singular: 'Square Foot',
      plural: 'Square Feet',
    },
    to_anchor: 1,
  },
  ac: {
    name: {
      singular: 'Acre',
      plural: 'Acres',
    },
    to_anchor: 43560,
  },
  mi2: {
    name: {
      singular: 'Square Mile',
      plural: 'Square Miles',
    },
    to_anchor: 27878400,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'm2',
      ratio: 10.7639,
    },
    imperial: {
      unit: 'ft2',
      ratio: 1 / 10.7639,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715966, function(require, module, exports) {
var metric, imperial

metric = {
  mcg: {
    name: {
      singular: 'Microgram',
      plural: 'Micrograms',
    },
    to_anchor: 1 / 1000000,
  },
  mg: {
    name: {
      singular: 'Milligram',
      plural: 'Milligrams',
    },
    to_anchor: 1 / 1000,
  },
  g: {
    name: {
      singular: 'Gram',
      plural: 'Grams',
    },
    to_anchor: 1,
  },
  kg: {
    name: {
      singular: 'Kilogram',
      plural: 'Kilograms',
    },
    to_anchor: 1000,
  },
  mt: {
    name: {
      singular: 'Metric Tonne',
      plural: 'Metric Tonnes',
    },
    to_anchor: 1000000,
  },
}

imperial = {
  oz: {
    name: {
      singular: 'Ounce',
      plural: 'Ounces',
    },
    to_anchor: 1 / 16,
  },
  lb: {
    name: {
      singular: 'Pound',
      plural: 'Pounds',
    },
    to_anchor: 1,
  },
  t: {
    name: {
      singular: 'Ton',
      plural: 'Tons',
    },
    to_anchor: 2000,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'g',
      ratio: 1 / 453.592,
    },
    imperial: {
      unit: 'lb',
      ratio: 453.592,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715967, function(require, module, exports) {
var metric, imperial

metric = {
  mm3: {
    name: {
      singular: 'Cubic Millimeter',
      plural: 'Cubic Millimeters',
    },
    to_anchor: 1 / 1000000,
  },
  cm3: {
    name: {
      singular: 'Cubic Centimeter',
      plural: 'Cubic Centimeters',
    },
    to_anchor: 1 / 1000,
  },
  ml: {
    name: {
      singular: 'Millilitre',
      plural: 'Millilitres',
    },
    to_anchor: 1 / 1000,
  },
  cl: {
    name: {
      singular: 'Centilitre',
      plural: 'Centilitres',
    },
    to_anchor: 1 / 100,
  },
  dl: {
    name: {
      singular: 'Decilitre',
      plural: 'Decilitres',
    },
    to_anchor: 1 / 10,
  },
  l: {
    name: {
      singular: 'Litre',
      plural: 'Litres',
    },
    to_anchor: 1,
  },
  kl: {
    name: {
      singular: 'Kilolitre',
      plural: 'Kilolitres',
    },
    to_anchor: 1000,
  },
  Ml: {
    name: {
      singular: 'Megalitre',
      plural: 'Megalitres',
    },
    to_anchor: 1e6,
  },
  Gl: {
    name: {
      singular: 'Gigalitre',
      plural: 'Gigalitres',
    },
    to_anchor: 1e9,
  },
  m3: {
    name: {
      singular: 'Cubic meter',
      plural: 'Cubic meters',
    },
    to_anchor: 1000,
  },
  km3: {
    name: {
      singular: 'Cubic kilometer',
      plural: 'Cubic kilometers',
    },
    to_anchor: 1000000000000,
  },

  // Swedish units
  krm: {
    name: {
      singular: 'Kryddmått',
      plural: 'Kryddmått',
    },
    to_anchor: 1 / 1000,
  },
  tsk: {
    name: {
      singular: 'Tesked',
      plural: 'Teskedar',
    },
    to_anchor: 5 / 1000,
  },
  msk: {
    name: {
      singular: 'Matsked',
      plural: 'Matskedar',
    },
    to_anchor: 15 / 1000,
  },
  kkp: {
    name: {
      singular: 'Kaffekopp',
      plural: 'Kaffekoppar',
    },
    to_anchor: 150 / 1000,
  },
  glas: {
    name: {
      singular: 'Glas',
      plural: 'Glas',
    },
    to_anchor: 200 / 1000,
  },
  kanna: {
    name: {
      singular: 'Kanna',
      plural: 'Kannor',
    },
    to_anchor: 2.617,
  },
}

imperial = {
  tsp: {
    name: {
      singular: 'Teaspoon',
      plural: 'Teaspoons',
    },
    to_anchor: 1 / 6,
  },
  Tbs: {
    name: {
      singular: 'Tablespoon',
      plural: 'Tablespoons',
    },
    to_anchor: 1 / 2,
  },
  in3: {
    name: {
      singular: 'Cubic inch',
      plural: 'Cubic inches',
    },
    to_anchor: 0.55411,
  },
  'fl-oz': {
    name: {
      singular: 'Fluid Ounce',
      plural: 'Fluid Ounces',
    },
    to_anchor: 1,
  },
  cup: {
    name: {
      singular: 'Cup',
      plural: 'Cups',
    },
    to_anchor: 8,
  },
  pnt: {
    name: {
      singular: 'Pint',
      plural: 'Pints',
    },
    to_anchor: 16,
  },
  qt: {
    name: {
      singular: 'Quart',
      plural: 'Quarts',
    },
    to_anchor: 32,
  },
  gal: {
    name: {
      singular: 'Gallon',
      plural: 'Gallons',
    },
    to_anchor: 128,
  },
  ft3: {
    name: {
      singular: 'Cubic foot',
      plural: 'Cubic feet',
    },
    to_anchor: 957.506,
  },
  yd3: {
    name: {
      singular: 'Cubic yard',
      plural: 'Cubic yards',
    },
    to_anchor: 25852.7,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'l',
      ratio: 33.8140226,
    },
    imperial: {
      unit: 'fl-oz',
      ratio: 1 / 33.8140226,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715968, function(require, module, exports) {
var metric, imperial

metric = {
  ea: {
    name: {
      singular: 'Each',
      plural: 'Each',
    },
    to_anchor: 1,
  },
  dz: {
    name: {
      singular: 'Dozen',
      plural: 'Dozens',
    },
    to_anchor: 12,
  },
}

module.exports = {
  metric: metric,
  imperial: {},
  _anchors: {
    metric: {
      unit: 'ea',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715969, function(require, module, exports) {
var metric, imperial

metric = {
  C: {
    name: {
      singular: 'degree Celsius',
      plural: 'degrees Celsius',
    },
    to_anchor: 1,
    anchor_shift: 0,
  },
  K: {
    name: {
      singular: 'Kelvin',
      plural: 'Kelvins',
    },
    to_anchor: 1,
    anchor_shift: 273.15,
  },
}

imperial = {
  F: {
    name: {
      singular: 'degree Fahrenheit',
      plural: 'degrees Fahrenheit',
    },
    to_anchor: 1,
  },
  R: {
    name: {
      singular: 'degree Rankine',
      plural: 'degrees Rankine',
    },
    to_anchor: 1,
    anchor_shift: 459.67,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'C',
      transform: function (C) {
        return C / (5 / 9) + 32
      },
    },
    imperial: {
      unit: 'F',
      transform: function (F) {
        return (F - 32) * (5 / 9)
      },
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715970, function(require, module, exports) {
var time
var daysInYear = 365.25

time = {
  ns: {
    name: {
      singular: 'Nanosecond',
      plural: 'Nanoseconds',
    },
    to_anchor: 1 / 1000000000,
  },
  mu: {
    name: {
      singular: 'Microsecond',
      plural: 'Microseconds',
    },
    to_anchor: 1 / 1000000,
  },
  ms: {
    name: {
      singular: 'Millisecond',
      plural: 'Milliseconds',
    },
    to_anchor: 1 / 1000,
  },
  s: {
    name: {
      singular: 'Second',
      plural: 'Seconds',
    },
    to_anchor: 1,
  },
  min: {
    name: {
      singular: 'Minute',
      plural: 'Minutes',
    },
    to_anchor: 60,
  },
  h: {
    name: {
      singular: 'Hour',
      plural: 'Hours',
    },
    to_anchor: 60 * 60,
  },
  d: {
    name: {
      singular: 'Day',
      plural: 'Days',
    },
    to_anchor: 60 * 60 * 24,
  },
  week: {
    name: {
      singular: 'Week',
      plural: 'Weeks',
    },
    to_anchor: 60 * 60 * 24 * 7,
  },
  month: {
    name: {
      singular: 'Month',
      plural: 'Months',
    },
    to_anchor: (60 * 60 * 24 * daysInYear) / 12,
  },
  year: {
    name: {
      singular: 'Year',
      plural: 'Years',
    },
    to_anchor: 60 * 60 * 24 * daysInYear,
  },
}

module.exports = {
  metric: time,
  _anchors: {
    metric: {
      unit: 's',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715971, function(require, module, exports) {
var bits, bytes

bits = {
  b: {
    name: {
      singular: 'Bit',
      plural: 'Bits',
    },
    to_anchor: 1,
  },
  Kb: {
    name: {
      singular: 'Kilobit',
      plural: 'Kilobits',
    },
    to_anchor: 1024,
  },
  Mb: {
    name: {
      singular: 'Megabit',
      plural: 'Megabits',
    },
    to_anchor: 1048576,
  },
  Gb: {
    name: {
      singular: 'Gigabit',
      plural: 'Gigabits',
    },
    to_anchor: 1073741824,
  },
  Tb: {
    name: {
      singular: 'Terabit',
      plural: 'Terabits',
    },
    to_anchor: 1099511627776,
  },
}

bytes = {
  B: {
    name: {
      singular: 'Byte',
      plural: 'Bytes',
    },
    to_anchor: 1,
  },
  KB: {
    name: {
      singular: 'Kilobyte',
      plural: 'Kilobytes',
    },
    to_anchor: 1024,
  },
  MB: {
    name: {
      singular: 'Megabyte',
      plural: 'Megabytes',
    },
    to_anchor: 1048576,
  },
  GB: {
    name: {
      singular: 'Gigabyte',
      plural: 'Gigabytes',
    },
    to_anchor: 1073741824,
  },
  TB: {
    name: {
      singular: 'Terabyte',
      plural: 'Terabytes',
    },
    to_anchor: 1099511627776,
  },
}

module.exports = {
  bits: bits,
  bytes: bytes,
  _anchors: {
    bits: {
      unit: 'b',
      ratio: 1 / 8,
    },
    bytes: {
      unit: 'B',
      ratio: 8,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715972, function(require, module, exports) {
var metric, imperial

metric = {
  ppm: {
    name: {
      singular: 'Part-per Million',
      plural: 'Parts-per Million',
    },
    to_anchor: 1,
  },
  ppb: {
    name: {
      singular: 'Part-per Billion',
      plural: 'Parts-per Billion',
    },
    to_anchor: 0.001,
  },
  ppt: {
    name: {
      singular: 'Part-per Trillion',
      plural: 'Parts-per Trillion',
    },
    to_anchor: 0.000001,
  },
  ppq: {
    name: {
      singular: 'Part-per Quadrillion',
      plural: 'Parts-per Quadrillion',
    },
    to_anchor: 0.000000001,
  },
}

module.exports = {
  metric: metric,
  imperial: {},
  _anchors: {
    metric: {
      unit: 'ppm',
      ratio: 0.000001,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715973, function(require, module, exports) {
var metric, imperial

metric = {
  'm/s': {
    name: {
      singular: 'Metre per second',
      plural: 'Metres per second',
    },
    to_anchor: 3.6,
  },
  'km/h': {
    name: {
      singular: 'Kilometre per hour',
      plural: 'Kilometres per hour',
    },
    to_anchor: 1,
  },
  'mm/h': {
    name: {
      singular: 'Millimeter per hour',
      plural: 'Millimeters per hour',
    },
    to_anchor: 0.000001,
  },
}

imperial = {
  mph: {
    name: {
      singular: 'Mile per hour',
      plural: 'Miles per hour',
    },
    to_anchor: 1,
  },
  knot: {
    name: {
      singular: 'Knot',
      plural: 'Knots',
    },
    to_anchor: 1.150779,
  },
  'ft/s': {
    name: {
      singular: 'Foot per second',
      plural: 'Feet per second',
    },
    to_anchor: 0.681818,
  },
  'ft/min': {
    name: {
      singular: 'Foot per minute',
      plural: 'Feet per minute',
    },
    to_anchor: 0.0113636,
  },
  'in/h': {
    name: {
      singular: 'Inch per hour',
      plural: 'Inches per hour',
    },
    to_anchor: 0.00001578,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'km/h',
      ratio: 1 / 1.609344,
    },
    imperial: {
      unit: 'm/h',
      ratio: 1.609344,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715974, function(require, module, exports) {
var metric, imperial

metric = {
  'min/km': {
    name: {
      singular: 'Minute per kilometre',
      plural: 'Minutes per kilometre',
    },
    to_anchor: 0.06,
  },
  's/m': {
    name: {
      singular: 'Second per metre',
      plural: 'Seconds per metre',
    },
    to_anchor: 1,
  },
}

imperial = {
  'min/mi': {
    name: {
      singular: 'Minute per mile',
      plural: 'Minutes per mile',
    },
    to_anchor: 0.0113636,
  },
  's/ft': {
    name: {
      singular: 'Second per foot',
      plural: 'Seconds per foot',
    },
    to_anchor: 1,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 's/m',
      ratio: 0.3048,
    },
    imperial: {
      unit: 's/ft',
      ratio: 1 / 0.3048,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715975, function(require, module, exports) {
var metric, imperial

metric = {
  Pa: {
    name: {
      singular: 'pascal',
      plural: 'pascals',
    },
    to_anchor: 1 / 1000,
  },
  kPa: {
    name: {
      singular: 'kilopascal',
      plural: 'kilopascals',
    },
    to_anchor: 1,
  },
  MPa: {
    name: {
      singular: 'megapascal',
      plural: 'megapascals',
    },
    to_anchor: 1000,
  },
  hPa: {
    name: {
      singular: 'hectopascal',
      plural: 'hectopascals',
    },
    to_anchor: 1 / 10,
  },
  bar: {
    name: {
      singular: 'bar',
      plural: 'bar',
    },
    to_anchor: 100,
  },
  torr: {
    name: {
      singular: 'torr',
      plural: 'torr',
    },
    to_anchor: 101325 / 760000,
  },
  mH2O: {
    name: {
      singular: 'meter of water @ 4°C',
      plural: 'meters of water @ 4°C',
    },
    to_anchor: 9.80665,
  },
  mmHg: {
    name: {
      singular: 'millimeter of mercury',
      plural: 'millimeters of mercury',
    },
    to_anchor: 0.133322,
  },
}

imperial = {
  psi: {
    name: {
      singular: 'pound per square inch',
      plural: 'pounds per square inch',
    },
    to_anchor: 1 / 1000,
  },
  ksi: {
    name: {
      singular: 'kilopound per square inch',
      plural: 'kilopound per square inch',
    },
    to_anchor: 1,
  },
  inHg: {
    name: {
      singular: 'Inch of mercury',
      plural: 'Inches of mercury',
    },
    to_anchor: 0.000491154,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'kPa',
      ratio: 0.00014503768078,
    },
    imperial: {
      unit: 'psi',
      ratio: 1 / 0.00014503768078,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715976, function(require, module, exports) {
var current

current = {
  A: {
    name: {
      singular: 'Ampere',
      plural: 'Amperes',
    },
    to_anchor: 1,
  },
  mA: {
    name: {
      singular: 'Milliampere',
      plural: 'Milliamperes',
    },
    to_anchor: 0.001,
  },
  kA: {
    name: {
      singular: 'Kiloampere',
      plural: 'Kiloamperes',
    },
    to_anchor: 1000,
  },
}

module.exports = {
  metric: current,
  _anchors: {
    metric: {
      unit: 'A',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715977, function(require, module, exports) {
var voltage

voltage = {
  V: {
    name: {
      singular: 'Volt',
      plural: 'Volts',
    },
    to_anchor: 1,
  },
  mV: {
    name: {
      singular: 'Millivolt',
      plural: 'Millivolts',
    },
    to_anchor: 0.001,
  },
  kV: {
    name: {
      singular: 'Kilovolt',
      plural: 'Kilovolts',
    },
    to_anchor: 1000,
  },
}

module.exports = {
  metric: voltage,
  _anchors: {
    metric: {
      unit: 'V',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715978, function(require, module, exports) {
var metric, imperial

metric = {
  W: {
    name: {
      singular: 'Watt',
      plural: 'Watts',
    },
    to_anchor: 1,
  },
  mW: {
    name: {
      singular: 'Milliwatt',
      plural: 'Milliwatts',
    },
    to_anchor: 0.001,
  },
  kW: {
    name: {
      singular: 'Kilowatt',
      plural: 'Kilowatts',
    },
    to_anchor: 1000,
  },
  MW: {
    name: {
      singular: 'Megawatt',
      plural: 'Megawatts',
    },
    to_anchor: 1000000,
  },
  GW: {
    name: {
      singular: 'Gigawatt',
      plural: 'Gigawatts',
    },
    to_anchor: 1000000000,
  },
  PS: {
    name: {
      singular: 'Horsepower (metric)',
      plural: 'Horsepower (metric)',
    },
    to_anchor: 735.49875,
  },
}

imperial = {
  'Btu/s': {
    name: {
      singular: 'British thermal unit per second',
      plural: 'British thermal units per second',
    },
    to_anchor: 778.16937,
  },
  'ft-lb/s': {
    name: {
      singular: 'Foot-pound per second',
      plural: 'Foot-pounds per second',
    },
    to_anchor: 1,
  },
  hp: {
    name: {
      singular: 'Horsepower (British)',
      plural: 'Horsepower (British)',
    },
    to_anchor: 550,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'W',
      ratio: 0.737562149,
    },
    imperial: {
      unit: 'ft-lb/s',
      ratio: 1 / 0.737562149,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715979, function(require, module, exports) {
var reactivePower

reactivePower = {
  VAR: {
    name: {
      singular: 'Volt-Ampere Reactive',
      plural: 'Volt-Amperes Reactive',
    },
    to_anchor: 1,
  },
  mVAR: {
    name: {
      singular: 'Millivolt-Ampere Reactive',
      plural: 'Millivolt-Amperes Reactive',
    },
    to_anchor: 0.001,
  },
  kVAR: {
    name: {
      singular: 'Kilovolt-Ampere Reactive',
      plural: 'Kilovolt-Amperes Reactive',
    },
    to_anchor: 1000,
  },
  MVAR: {
    name: {
      singular: 'Megavolt-Ampere Reactive',
      plural: 'Megavolt-Amperes Reactive',
    },
    to_anchor: 1000000,
  },
  GVAR: {
    name: {
      singular: 'Gigavolt-Ampere Reactive',
      plural: 'Gigavolt-Amperes Reactive',
    },
    to_anchor: 1000000000,
  },
}

module.exports = {
  metric: reactivePower,
  _anchors: {
    metric: {
      unit: 'VAR',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715980, function(require, module, exports) {
var apparentPower

apparentPower = {
  VA: {
    name: {
      singular: 'Volt-Ampere',
      plural: 'Volt-Amperes',
    },
    to_anchor: 1,
  },
  mVA: {
    name: {
      singular: 'Millivolt-Ampere',
      plural: 'Millivolt-Amperes',
    },
    to_anchor: 0.001,
  },
  kVA: {
    name: {
      singular: 'Kilovolt-Ampere',
      plural: 'Kilovolt-Amperes',
    },
    to_anchor: 1000,
  },
  MVA: {
    name: {
      singular: 'Megavolt-Ampere',
      plural: 'Megavolt-Amperes',
    },
    to_anchor: 1000000,
  },
  GVA: {
    name: {
      singular: 'Gigavolt-Ampere',
      plural: 'Gigavolt-Amperes',
    },
    to_anchor: 1000000000,
  },
}

module.exports = {
  metric: apparentPower,
  _anchors: {
    metric: {
      unit: 'VA',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715981, function(require, module, exports) {
var energy

energy = {
  Ws: {
    name: {
      singular: 'Watt-second',
      plural: 'Watt-seconds',
    },
    to_anchor: 1,
  },
  Wm: {
    name: {
      singular: 'Watt-minute',
      plural: 'Watt-minutes',
    },
    to_anchor: 60,
  },
  Wh: {
    name: {
      singular: 'Watt-hour',
      plural: 'Watt-hours',
    },
    to_anchor: 3600,
  },
  mWh: {
    name: {
      singular: 'Milliwatt-hour',
      plural: 'Milliwatt-hours',
    },
    to_anchor: 3.6,
  },
  kWh: {
    name: {
      singular: 'Kilowatt-hour',
      plural: 'Kilowatt-hours',
    },
    to_anchor: 3600000,
  },
  MWh: {
    name: {
      singular: 'Megawatt-hour',
      plural: 'Megawatt-hours',
    },
    to_anchor: 3600000000,
  },
  GWh: {
    name: {
      singular: 'Gigawatt-hour',
      plural: 'Gigawatt-hours',
    },
    to_anchor: 3600000000000,
  },
  J: {
    name: {
      singular: 'Joule',
      plural: 'Joules',
    },
    to_anchor: 1,
  },
  kJ: {
    name: {
      singular: 'Kilojoule',
      plural: 'Kilojoules',
    },
    to_anchor: 1000,
  },
  MJ: {
    name: {
      singular: 'Megajoule',
      plural: 'Megajoules',
    },
    to_anchor: 1e6,
  },
  GJ: {
    name: {
      singular: 'Gigajoule',
      plural: 'Gigajoules',
    },
    to_anchor: 1e9,
  },
}

module.exports = {
  metric: energy,
  _anchors: {
    metric: {
      unit: 'J',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715982, function(require, module, exports) {
var reactiveEnergy

reactiveEnergy = {
  VARh: {
    name: {
      singular: 'Volt-Ampere Reactive Hour',
      plural: 'Volt-Amperes Reactive Hour',
    },
    to_anchor: 1,
  },
  mVARh: {
    name: {
      singular: 'Millivolt-Ampere Reactive Hour',
      plural: 'Millivolt-Amperes Reactive Hour',
    },
    to_anchor: 0.001,
  },
  kVARh: {
    name: {
      singular: 'Kilovolt-Ampere Reactive Hour',
      plural: 'Kilovolt-Amperes Reactive Hour',
    },
    to_anchor: 1000,
  },
  MVARh: {
    name: {
      singular: 'Megavolt-Ampere Reactive Hour',
      plural: 'Megavolt-Amperes Reactive Hour',
    },
    to_anchor: 1000000,
  },
  GVARh: {
    name: {
      singular: 'Gigavolt-Ampere Reactive Hour',
      plural: 'Gigavolt-Amperes Reactive Hour',
    },
    to_anchor: 1000000000,
  },
}

module.exports = {
  metric: reactiveEnergy,
  _anchors: {
    metric: {
      unit: 'VARh',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715983, function(require, module, exports) {
var metric, imperial

metric = {
  'mm3/s': {
    name: {
      singular: 'Cubic Millimeter per second',
      plural: 'Cubic Millimeters per second',
    },
    to_anchor: 1 / 1000000,
  },
  'cm3/s': {
    name: {
      singular: 'Cubic Centimeter per second',
      plural: 'Cubic Centimeters per second',
    },
    to_anchor: 1 / 1000,
  },
  'ml/s': {
    name: {
      singular: 'Millilitre per second',
      plural: 'Millilitres per second',
    },
    to_anchor: 1 / 1000,
  },
  'cl/s': {
    name: {
      singular: 'Centilitre per second',
      plural: 'Centilitres per second',
    },
    to_anchor: 1 / 100,
  },
  'dl/s': {
    name: {
      singular: 'Decilitre per second',
      plural: 'Decilitres per second',
    },
    to_anchor: 1 / 10,
  },
  'l/s': {
    name: {
      singular: 'Litre per second',
      plural: 'Litres per second',
    },
    to_anchor: 1,
  },
  'l/min': {
    name: {
      singular: 'Litre per minute',
      plural: 'Litres per minute',
    },
    to_anchor: 1 / 60,
  },
  'l/h': {
    name: {
      singular: 'Litre per hour',
      plural: 'Litres per hour',
    },
    to_anchor: 1 / 3600,
  },
  'kl/s': {
    name: {
      singular: 'Kilolitre per second',
      plural: 'Kilolitres per second',
    },
    to_anchor: 1000,
  },
  'kl/min': {
    name: {
      singular: 'Kilolitre per minute',
      plural: 'Kilolitres per minute',
    },
    to_anchor: 50 / 3,
  },
  'kl/h': {
    name: {
      singular: 'Kilolitre per hour',
      plural: 'Kilolitres per hour',
    },
    to_anchor: 5 / 18,
  },
  'm3/s': {
    name: {
      singular: 'Cubic meter per second',
      plural: 'Cubic meters per second',
    },
    to_anchor: 1000,
  },
  'm3/min': {
    name: {
      singular: 'Cubic meter per minute',
      plural: 'Cubic meters per minute',
    },
    to_anchor: 50 / 3,
  },
  'm3/h': {
    name: {
      singular: 'Cubic meter per hour',
      plural: 'Cubic meters per hour',
    },
    to_anchor: 5 / 18,
  },
  'km3/s': {
    name: {
      singular: 'Cubic kilometer per second',
      plural: 'Cubic kilometers per second',
    },
    to_anchor: 1000000000000,
  },
}

imperial = {
  'tsp/s': {
    name: {
      singular: 'Teaspoon per second',
      plural: 'Teaspoons per second',
    },
    to_anchor: 1 / 6,
  },
  'Tbs/s': {
    name: {
      singular: 'Tablespoon per second',
      plural: 'Tablespoons per second',
    },
    to_anchor: 1 / 2,
  },
  'in3/s': {
    name: {
      singular: 'Cubic inch per second',
      plural: 'Cubic inches per second',
    },
    to_anchor: 0.55411,
  },
  'in3/min': {
    name: {
      singular: 'Cubic inch per minute',
      plural: 'Cubic inches per minute',
    },
    to_anchor: 0.55411 / 60,
  },
  'in3/h': {
    name: {
      singular: 'Cubic inch per hour',
      plural: 'Cubic inches per hour',
    },
    to_anchor: 0.55411 / 3600,
  },
  'fl-oz/s': {
    name: {
      singular: 'Fluid Ounce per second',
      plural: 'Fluid Ounces per second',
    },
    to_anchor: 1,
  },
  'fl-oz/min': {
    name: {
      singular: 'Fluid Ounce per minute',
      plural: 'Fluid Ounces per minute',
    },
    to_anchor: 1 / 60,
  },
  'fl-oz/h': {
    name: {
      singular: 'Fluid Ounce per hour',
      plural: 'Fluid Ounces per hour',
    },
    to_anchor: 1 / 3600,
  },
  'cup/s': {
    name: {
      singular: 'Cup per second',
      plural: 'Cups per second',
    },
    to_anchor: 8,
  },
  'pnt/s': {
    name: {
      singular: 'Pint per second',
      plural: 'Pints per second',
    },
    to_anchor: 16,
  },
  'pnt/min': {
    name: {
      singular: 'Pint per minute',
      plural: 'Pints per minute',
    },
    to_anchor: 4 / 15,
  },
  'pnt/h': {
    name: {
      singular: 'Pint per hour',
      plural: 'Pints per hour',
    },
    to_anchor: 1 / 225,
  },
  'qt/s': {
    name: {
      singular: 'Quart per second',
      plural: 'Quarts per second',
    },
    to_anchor: 32,
  },
  'gal/s': {
    name: {
      singular: 'Gallon per second',
      plural: 'Gallons per second',
    },
    to_anchor: 128,
  },
  'gal/min': {
    name: {
      singular: 'Gallon per minute',
      plural: 'Gallons per minute',
    },
    to_anchor: 32 / 15,
  },
  'gal/h': {
    name: {
      singular: 'Gallon per hour',
      plural: 'Gallons per hour',
    },
    to_anchor: 8 / 225,
  },
  'ft3/s': {
    name: {
      singular: 'Cubic foot per second',
      plural: 'Cubic feet per second',
    },
    to_anchor: 957.506,
  },
  'ft3/min': {
    name: {
      singular: 'Cubic foot per minute',
      plural: 'Cubic feet per minute',
    },
    to_anchor: 957.506 / 60,
  },
  'ft3/h': {
    name: {
      singular: 'Cubic foot per hour',
      plural: 'Cubic feet per hour',
    },
    to_anchor: 957.506 / 3600,
  },
  'yd3/s': {
    name: {
      singular: 'Cubic yard per second',
      plural: 'Cubic yards per second',
    },
    to_anchor: 25852.7,
  },
  'yd3/min': {
    name: {
      singular: 'Cubic yard per minute',
      plural: 'Cubic yards per minute',
    },
    to_anchor: 25852.7 / 60,
  },
  'yd3/h': {
    name: {
      singular: 'Cubic yard per hour',
      plural: 'Cubic yards per hour',
    },
    to_anchor: 25852.7 / 3600,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'l/s',
      ratio: 33.8140227,
    },
    imperial: {
      unit: 'fl-oz/s',
      ratio: 1 / 33.8140227,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715984, function(require, module, exports) {
var metric, imperial

metric = {
  lx: {
    name: {
      singular: 'Lux',
      plural: 'Lux',
    },
    to_anchor: 1,
  },
}

imperial = {
  'ft-cd': {
    name: {
      singular: 'Foot-candle',
      plural: 'Foot-candles',
    },
    to_anchor: 1,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'lx',
      ratio: 1 / 10.76391,
    },
    imperial: {
      unit: 'ft-cd',
      ratio: 10.76391,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715985, function(require, module, exports) {
var frequency

frequency = {
  mHz: {
    name: {
      singular: 'millihertz',
      plural: 'millihertz',
    },
    to_anchor: 1 / 1000,
  },
  Hz: {
    name: {
      singular: 'hertz',
      plural: 'hertz',
    },
    to_anchor: 1,
  },
  kHz: {
    name: {
      singular: 'kilohertz',
      plural: 'kilohertz',
    },
    to_anchor: 1000,
  },
  MHz: {
    name: {
      singular: 'megahertz',
      plural: 'megahertz',
    },
    to_anchor: 1000 * 1000,
  },
  GHz: {
    name: {
      singular: 'gigahertz',
      plural: 'gigahertz',
    },
    to_anchor: 1000 * 1000 * 1000,
  },
  THz: {
    name: {
      singular: 'terahertz',
      plural: 'terahertz',
    },
    to_anchor: 1000 * 1000 * 1000 * 1000,
  },
  rpm: {
    name: {
      singular: 'rotation per minute',
      plural: 'rotations per minute',
    },
    to_anchor: 1 / 60,
  },
  'deg/s': {
    name: {
      singular: 'degree per second',
      plural: 'degrees per second',
    },
    to_anchor: 1 / 360,
  },
  'rad/s': {
    name: {
      singular: 'radian per second',
      plural: 'radians per second',
    },
    to_anchor: 1 / (Math.PI * 2),
  },
}

module.exports = {
  metric: frequency,
  _anchors: {
    frequency: {
      unit: 'hz',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715986, function(require, module, exports) {
var angle

angle = {
  rad: {
    name: {
      singular: 'radian',
      plural: 'radians',
    },
    to_anchor: 180 / Math.PI,
  },
  deg: {
    name: {
      singular: 'degree',
      plural: 'degrees',
    },
    to_anchor: 1,
  },
  grad: {
    name: {
      singular: 'gradian',
      plural: 'gradians',
    },
    to_anchor: 9 / 10,
  },
  arcmin: {
    name: {
      singular: 'arcminute',
      plural: 'arcminutes',
    },
    to_anchor: 1 / 60,
  },
  arcsec: {
    name: {
      singular: 'arcsecond',
      plural: 'arcseconds',
    },
    to_anchor: 1 / 3600,
  },
}

module.exports = {
  metric: angle,
  _anchors: {
    metric: {
      unit: 'deg',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715987, function(require, module, exports) {
var charge

charge = {
  c: {
    name: {
      singular: 'Coulomb',
      plural: 'Coulombs',
    },
    to_anchor: 1,
  },
  mC: {
    name: {
      singular: 'Millicoulomb',
      plural: 'Millicoulombs',
    },
    to_anchor: 1 / 1000,
  },
  μC: {
    name: {
      singular: 'Microcoulomb',
      plural: 'Microcoulombs',
    },
    to_anchor: 1 / 1000000,
  },
  nC: {
    name: {
      singular: 'Nanocoulomb',
      plural: 'Nanocoulombs',
    },
    to_anchor: 1e-9,
  },
  pC: {
    name: {
      singular: 'Picocoulomb',
      plural: 'Picocoulombs',
    },
    to_anchor: 1e-12,
  },
}

module.exports = {
  metric: charge,
  _anchors: {
    metric: {
      unit: 'c',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715988, function(require, module, exports) {
var force

force = {
  N: {
    name: {
      singular: 'Newton',
      plural: 'Newtons',
    },
    to_anchor: 1,
  },
  kN: {
    name: {
      singular: 'Kilonewton',
      plural: 'Kilonewtons',
    },
    to_anchor: 1000,
  },
  lbf: {
    name: {
      singular: 'Pound-force',
      plural: 'Pound-forces',
    },
    to_anchor: 4.44822,
  },
}

module.exports = {
  metric: force,
  _anchors: {
    metric: {
      unit: 'N',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715989, function(require, module, exports) {
var metric, imperial

metric = {
  'kg/s': {
    name: {
      singular: 'Kilogram per second',
      plural: 'Kilograms per second',
    },
    to_anchor: 1,
  },
  'kg/h': {
    name: {
      singular: 'Kilogram per hour',
      plural: 'Kilograms per hour',
    },
    to_anchor: 1 / 3600,
  },
  'mt/h': {
    name: {
      singular: 'Ton per hour',
      plural: 'Tons per hour',
    },
    to_anchor: 1 / 3.6,
  },
}

imperial = {
  'lb/s': {
    name: {
      singular: 'Pound per second',
      plural: 'Pounds per second',
    },
    to_anchor: 1,
  },
  'lb/h': {
    name: {
      singular: 'Pound per hour',
      plural: 'Pounds per hour',
    },
    to_anchor: 1 / 3600,
  },
}

module.exports = {
  metric: metric,
  imperial: imperial,
  _anchors: {
    metric: {
      unit: 'kg/s',
			ratio: 1 / 0.453592,
    },
    imperial: {
      unit: 'lb/s',
			ratio: 0.453592,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1706713715990, function(require, module, exports) {
var pieces

pieces = {
  pcs: {
    name: {
      singular: 'Piece',
      plural: 'Pieces',
    },
    to_anchor: 1,
  },
  'bk-doz': {
    name: {
      singular: 'Bakers Dozen',
      plural: 'Bakers Dozen',
    },
    to_anchor: 13,
  },
  cp: {
    name: {
      singular: 'Couple',
      plural: 'Couples',
    },
    to_anchor: 2,
  },
  'doz-doz': {
    name: {
      singular: 'Dozen Dozen',
      plural: 'Dozen Dozen',
    },
    to_anchor: 144,
  },
  doz: {
    name: {
      singular: 'Dozen',
      plural: 'Dozens',
    },
    to_anchor: 12,
  },
  'gr-gr': {
    name: {
      singular: 'Great Gross',
      plural: 'Great Gross',
    },
    to_anchor: 1728,
  },
  gros: {
    name: {
      singular: 'Gross',
      plural: 'Gross',
    },
    to_anchor: 144,
  },
  'half-dozen': {
    name: {
      singular: 'Half Dozen',
      plural: 'Half Dozen',
    },
    to_anchor: 6,
  },
  'long-hundred': {
    name: {
      singular: 'Long Hundred',
      plural: 'Long Hundred',
    },
    to_anchor: 120,
  },
  ream: {
    name: {
      singular: 'Reams',
      plural: 'Reams',
    },
    to_anchor: 500,
  },
  scores: {
    name: {
      singular: 'Scores',
      plural: 'Scores',
    },
    to_anchor: 20,
  },
  'sm-gr': {
    name: {
      singular: 'Small Gross',
      plural: 'Small Gross',
    },
    to_anchor: 120,
  },
  trio: {
    name: {
      singular: 'Trio',
      plural: 'Trio',
    },
    to_anchor: 3,
  },
}

module.exports = {
  metric: pieces,
  _anchors: {
    metric: {
      unit: 'pcs',
      ratio: 1,
    },
  },
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1706713715963);
})()
//miniprogram-npm-outsideDeps=["decimal.js","lodash.keys","lodash.foreach"]
//# sourceMappingURL=index.js.map