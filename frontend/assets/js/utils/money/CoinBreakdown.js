import { DEFAULT_DENOMINATION_KEYS, GEMS_MULTIPLIER } from './moneyDenominations.js';

const DEFAULT_CASCADE_THRESHOLD = 30;

/**
 * Transforms a raw copper-piece total into a cascading breakdown of coin
 * denominations. By default it cascades through copper, silver, gold and
 * platinum, converting any leftover value above platinum into a gems entry;
 * callers may restrict the denominations used, in which case the last
 * denomination in the list absorbs all remaining value instead of
 * overflowing into gems.
 */
export default class CoinBreakdown {
  /**
   * Ensure a cascade threshold is a round multiple of ten, since the cascade
   * arithmetic only makes sense for values landing on a tens boundary.
   *
   * @param {number} threshold - The candidate cascade threshold.
   * @returns {void}
   */
  static #assertValidThreshold(threshold) {
    if (threshold % 10 !== 0) {
      throw new Error(`Cascade threshold must be a multiple of 10, got ${threshold}`);
    }
  }

  /**
   * Apply a single cascading denomination step, extracting the quantity that
   * fits in the current denomination (capped just below the threshold) and
   * carrying the excess up into the next denomination's units.
   *
   * @param {number} remaining - Remaining value, expressed in current
   *   denomination units.
   * @param {number} [threshold] - The value at/above which cascading kicks
   *   in, expressed as a round multiple of ten.
   * @returns {{quantity: number, remaining: number}} The quantity to display
   *   for this denomination, and the remaining value carried upward.
   */
  static #cascadeStep(remaining, threshold = DEFAULT_CASCADE_THRESHOLD) {
    CoinBreakdown.#assertValidThreshold(threshold);

    if (remaining >= threshold) {
      return {
        quantity: (remaining % 10) + (threshold - 10),
        remaining: Math.floor(remaining / 10) - (threshold / 10 - 1),
      };
    }

    return { quantity: remaining, remaining: 0 };
  }

  /**
   * Build a coin breakdown instance.
   *
   * @param {object} [options] - Breakdown options.
   * @param {string[]} [options.denominations] - Denomination keys, in
   *   cascading order from lowest to highest. The last entry absorbs all
   *   remaining value.
   * @param {number} [options.cascadeThreshold] - The value at/above which
   *   cascading kicks in, expressed as a round multiple of ten.
   */
  constructor({
    denominations = DEFAULT_DENOMINATION_KEYS,
    cascadeThreshold = DEFAULT_CASCADE_THRESHOLD,
  } = {}) {
    this.denominations = denominations;
    this.cascadeThreshold = cascadeThreshold;
    this.isDefaultDenominations = denominations === DEFAULT_DENOMINATION_KEYS;
  }

  /**
   * Build the full cascading denomination breakdown for a raw copper total,
   * including zero-quantity entries. Shared by `build` (which filters out
   * zero-quantity entries) and `buildDense` (which keeps them).
   *
   * @param {number} money - Total money, expressed in copper pieces.
   * @returns {{key: string, quantity: number}[]} All denomination entries in
   *   display order, lowest to highest denomination.
   */
  #buildEntries(money) {
    const lastIndex = this.denominations.length - 1;
    const { entries, remaining } = this.denominations.reduce((acc, key, index) => {
      const step = this.#stepFor(index, lastIndex, acc.remaining);

      return {
        entries: [...acc.entries, { key, quantity: step.quantity }],
        remaining: step.remaining,
      };
    }, { entries: [], remaining: money });

    if (this.isDefaultDenominations && remaining > 0) {
      entries.push({ key: 'gems', quantity: remaining * GEMS_MULTIPLIER });
    }

    return entries;
  }

  /**
   * Resolve the quantity/remaining pair for a single denomination step: the
   * last denomination absorbs all remaining value verbatim (for a
   * caller-restricted denomination list); every other denomination cascades
   * via {@link CoinBreakdown.#cascadeStep}.
   *
   * @param {number} index - Index of this denomination within `this.denominations`.
   * @param {number} lastIndex - Index of the last denomination in `this.denominations`.
   * @param {number} remaining - Remaining value carried in from the previous step.
   * @returns {{quantity: number, remaining: number}} The quantity to display
   *   for this denomination, and the remaining value carried upward.
   */
  #stepFor(index, lastIndex, remaining) {
    if (!this.isDefaultDenominations && index === lastIndex) {
      return { quantity: remaining, remaining: 0 };
    }

    return CoinBreakdown.#cascadeStep(remaining, this.cascadeThreshold);
  }

  /**
   * Build the coin denomination breakdown for a raw copper total.
   *
   * @param {number} [money] - Total money, expressed in copper pieces.
   * @returns {{key: string, quantity: number}[]} Non-zero denomination
   *   entries in display order, lowest to highest denomination.
   */
  build(money = 0) {
    return this.#buildEntries(money).filter((entry) => entry.quantity !== 0);
  }

  /**
   * Build the coin denomination breakdown for a raw copper total, keeping
   * zero-quantity entries (e.g. for a display that always shows every
   * denomination, such as the character money coin boxes).
   *
   * @param {number} [money] - Total money, expressed in copper pieces.
   * @returns {{key: string, quantity: number}[]} All denomination entries in
   *   display order, lowest to highest denomination, including zero-quantity
   *   ones.
   */
  buildDense(money = 0) {
    return this.#buildEntries(money);
  }
}
