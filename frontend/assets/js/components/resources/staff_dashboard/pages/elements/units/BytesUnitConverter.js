const THRESHOLDS = [
  { max: 921, unit: 'B', divisor: 1 },
  { max: 921 * 1024, unit: 'KB', divisor: 1024 },
  { max: 921 * 1024 ** 2, unit: 'MB', divisor: 1024 ** 2 },
];

const LARGEST = { unit: 'GB', divisor: 1024 ** 3 };

/**
 * Converts a raw byte count into the most appropriate unit (`B`, `KB`, `MB`
 * or `GB`), switching to the next unit once the value reaches roughly 90%
 * of the current unit's size.
 */
export default class BytesUnitConverter {
  /**
   * Convert a raw byte value into its best-fit unit and converted value.
   *
   * @param {number} rawValue - Raw value, in bytes.
   * @returns {{value: number, unit: string}} The converted value and its unit.
   */
  static convert(rawValue) {
    const threshold = THRESHOLDS.find(({ max }) => rawValue < max) ?? LARGEST;

    return { value: rawValue / threshold.divisor, unit: threshold.unit };
  }
}
