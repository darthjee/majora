import { DEFAULT_DENOMINATION_KEYS, GEMS_MULTIPLIER } from './moneyDenominations.js';

/**
 * Packs a coin denomination breakdown back into a single raw copper-piece
 * total — the inverse of {@link CoinBreakdown}. By default it sums copper,
 * silver, gold and platinum weighted by their relative place value and adds
 * a gems entry (already expressed in GP-equivalent units); callers may
 * restrict the denominations used, in which case no gems term is added.
 */
export default class CoinPacker {
  /**
   * Build a coin packer instance.
   *
   * @param {object} [options] - Packer options.
   * @param {string[]} [options.denominations] - Denomination keys, in
   *   cascading order from lowest to highest, matching the breakdown shape
   *   being packed.
   */
  constructor({ denominations = DEFAULT_DENOMINATION_KEYS } = {}) {
    this.denominations = denominations;
    this.isDefaultDenominations = denominations === DEFAULT_DENOMINATION_KEYS;
  }

  /**
   * Sum a coin denomination breakdown back into a raw copper-piece total.
   *
   * @param {object} [breakdown] - Map of denomination key to quantity (e.g.
   *   `{ cp, sp, gp, pp, gems }`). Missing or non-numeric fields are treated
   *   as 0.
   * @returns {number} Total value, expressed in copper pieces.
   */
  pack(breakdown = {}) {
    const total = this.denominations.reduce(
      (sum, key, index) => sum + (Number(breakdown[key]) || 0) * 10 ** index,
      0,
    );

    if (!this.isDefaultDenominations) {
      return total;
    }

    return total + (Number(breakdown.gems) || 0) * GEMS_MULTIPLIER;
  }
}
