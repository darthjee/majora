import BytesUnitConverter from './BytesUnitConverter.js';

const CONVERTERS = {
  bytes: BytesUnitConverter,
};

/**
 * Registry resolving a `valueType` (e.g. `bytes`) to its unit-conversion
 * class, plus shared number formatting for converted values.
 */
export default class UnitConverters {
  /**
   * Resolve the unit-conversion class registered for a `valueType`.
   *
   * @param {string} valueType - The value type to resolve (e.g. `bytes`).
   * @returns {{convert: Function}} The converter class registered for `valueType`.
   * @throws {Error} When no converter is registered for `valueType`.
   */
  static forType(valueType) {
    const converter = CONVERTERS[valueType];

    if (!converter) {
      throw new Error(`No unit converter registered for value type '${valueType}'`);
    }

    return converter;
  }

  /**
   * Format a converted numeric value with up to 1 decimal place, trimming a
   * trailing `.0` when present.
   *
   * @param {number} value - The converted numeric value to format.
   * @returns {string} The formatted value.
   */
  static formatValue(value) {
    return value.toFixed(1).replace(/\.0$/, '');
  }
}
