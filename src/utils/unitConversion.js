const conversions = {
  glucose: {
    'mg/dL': {
      'mg/dL': 1,
      'mmol/L': 0.0555
    },
    'mmol/L': {
      'mg/dL': 18.0182,
      'mmol/L': 1
    }
  },
  ketone: {
    'mmol/L': {
      'mmol/L': 1,
      'mg/dL': 10.0
    },
    'mg/dL': {
      'mmol/L': 0.1,
      'mg/dL': 1
    }
  },
  weight: {
    'kg': {
      'kg': 1,
      'lb': 2.20462
    },
    'lb': {
      'kg': 0.453592,
      'lb': 1
    }
  },
  height: {
    'cm': {
      'cm': 1,
      'in': 0.393701,
      'ft': 0.0328084
    },
    'in': {
      'cm': 2.54,
      'in': 1,
      'ft': 0.0833333
    },
    'ft': {
      'cm': 30.48,
      'in': 12,
      'ft': 1
    }
  }
};

function convert(value, type, fromUnit, toUnit) {
  if (!conversions[type] || !conversions[type][fromUnit] || !conversions[type][fromUnit][toUnit]) {
    throw new Error(`Invalid conversion: ${type} from ${fromUnit} to ${toUnit}`);
  }
  
  return value * conversions[type][fromUnit][toUnit];
}

function toStandardUnit(value, type, fromUnit) {
  const standardUnits = {
    glucose: 'mg/dL',
    ketone: 'mmol/L',
    weight: 'kg',
    height: 'cm'
  };
  
  return convert(value, type, fromUnit, standardUnits[type]);
}

function fromStandardUnit(value, type, toUnit) {
  const standardUnits = {
    glucose: 'mg/dL',
    ketone: 'mmol/L',
    weight: 'kg',
    height: 'cm'
  };
  
  return convert(value, type, standardUnits[type], toUnit);
}

function formatHeight(heightCm, unit) {
  if (unit === 'ft') {
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  
  return fromStandardUnit(heightCm, 'height', unit).toFixed(unit === 'cm' ? 0 : 1);
}

module.exports = {
  convert,
  toStandardUnit,
  fromStandardUnit,
  formatHeight
};