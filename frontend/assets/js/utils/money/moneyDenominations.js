/**
 * Default cascading denomination keys, from lowest to highest value, shared
 * by {@link CoinBreakdown} (unpacking) and {@link CoinPacker} (packing) so
 * both classes agree on which denomination set triggers gems overflow.
 *
 * @type {string[]}
 */
export const DEFAULT_DENOMINATION_KEYS = ['cp', 'sp', 'gp', 'pp'];

/**
 * Conversion rate between a "gems" entry (expressed in GP-equivalent units)
 * and its raw copper-piece value, shared by {@link CoinBreakdown} (unpacking)
 * and {@link CoinPacker} (packing) so the two directions never drift apart.
 *
 * @type {number}
 */
export const GEMS_MULTIPLIER = 100;
