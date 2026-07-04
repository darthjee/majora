const DENOMINATION_KEYS = ['cp', 'sp', 'gp', 'pp'];
const GEMS_MULTIPLIER = 100;
const CASCADE_THRESHOLD = 30;

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
export function cascadeStep(remaining, threshold = CASCADE_THRESHOLD) {
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
 * denominations (copper, silver, gold, platinum), with any leftover value
 * above platinum converted into a gems entry.
 */
export default class CoinBreakdown {
  /**
   * Build the coin denomination breakdown for a raw copper total.
   *
   * @param {number} [money] - Total money, expressed in copper pieces.
   * @returns {{key: string, quantity: number}[]} Non-zero denomination
   *   entries in display order (CP, SP, GP, PP, gems).
   */
  static build(money = 0) {
    let remaining = money;
    const entries = DENOMINATION_KEYS.map((key) => {
      const step = cascadeStep(remaining);

      remaining = step.remaining;

      return { key, quantity: step.quantity };
    });

    if (remaining > 0) {
      entries.push({ key: 'gems', quantity: remaining * GEMS_MULTIPLIER });
    }

    return entries.filter((entry) => entry.quantity !== 0);
  }
}
