/**
 * Normalizes a raw `thresholds` array (as received by `PercentageDisplay`) into a
 * fixed 3-element `[warnMax, dangerMax, overlimitMax]` array, and resolves a
 * percentage's color level against it.
 */
export default class PercentageThresholds {
  /**
   * Normalize a raw thresholds array into a 3-element `[warnMax, dangerMax,
   * overlimitMax]` array.
   *
   * @param {number[]|null|undefined} thresholds - Raw thresholds, 0-3 values.
   * @returns {number[]} Normalized `[warnMax, dangerMax, overlimitMax]` array.
   */
  static normalize(thresholds) {
    const sorted = [...(thresholds ?? [])].sort((a, b) => a - b);

    if (sorted.length === 0) return [0.5, 0.8, 1.0];
    if (sorted.length === 1) return PercentageThresholds.#normalizeSingle(sorted[0]);
    if (sorted.length === 2) return PercentageThresholds.#normalizeDouble(sorted);

    return sorted;
  }

  /**
   * Resolve the color level for a percentage against a raw thresholds array.
   *
   * @param {number} percentage - Percentage value, as a ratio (e.g. `0.42` for 42%).
   * @param {number[]|null|undefined} thresholds - Raw thresholds to normalize and check against.
   * @returns {'ok'|'warning'|'danger'|'overlimit'} The resolved color level.
   */
  static levelFor(percentage, thresholds) {
    const [warnMax, dangerMax, overlimitMax] = PercentageThresholds.normalize(thresholds);

    if (percentage <= warnMax) return 'ok';
    if (percentage <= dangerMax) return 'warning';
    if (percentage <= overlimitMax) return 'danger';

    return 'overlimit';
  }

  static #normalizeSingle(value) {
    return value < 1 ? [value, value, 1.0] : [value, value, value];
  }

  static #normalizeDouble([first, second]) {
    return second < 1 ? [first, second, 1.0] : [first, first, second];
  }
}
