const DEFAULT_DENOMINATION_KEYS = ['cp', 'sp', 'gp', 'pp'];
const GEMS_MULTIPLIER = 100;
const DEFAULT_CASCADE_THRESHOLD = 30;

/**
 * Ensure a cascade threshold is a round multiple of ten, since the cascade
 * arithmetic only makes sense for values landing on a tens boundary.
 *
 * @param {number} threshold - The candidate cascade threshold.
 * @returns {void}
 */
function assertValidThreshold(threshold) {
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
export function cascadeStep(remaining, threshold = DEFAULT_CASCADE_THRESHOLD) {
  assertValidThreshold(threshold);

  if (remaining >= threshold) {
    return {
      quantity: (remaining % 10) + (threshold - 10),
      remaining: Math.floor(remaining / 10) - (threshold / 10 - 1),
    };
  }

  return { quantity: remaining, remaining: 0 };
}

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
   * Build the coin denomination breakdown for a raw copper total.
   *
   * @param {number} [money] - Total money, expressed in copper pieces.
   * @returns {{key: string, quantity: number}[]} Non-zero denomination
   *   entries in display order, lowest to highest denomination.
   */
  build(money = 0) {
    const lastIndex = this.denominations.length - 1;
    let remaining = money;
    const entries = this.denominations.map((key, index) => {
      if (!this.isDefaultDenominations && index === lastIndex) {
        const quantity = remaining;
        remaining = 0;

        return { key, quantity };
      }

      const step = cascadeStep(remaining, this.cascadeThreshold);

      remaining = step.remaining;

      return { key, quantity: step.quantity };
    });

    if (this.isDefaultDenominations && remaining > 0) {
      entries.push({ key: 'gems', quantity: remaining * GEMS_MULTIPLIER });
    }

    return entries.filter((entry) => entry.quantity !== 0);
  }
}
