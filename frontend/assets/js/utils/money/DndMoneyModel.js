import CoinBreakdown from './CoinBreakdown.js';
import MoneyModelRegistry from './MoneyModelRegistry.js';

// The `character` config intentionally omits `denominations` so CoinBreakdown
// falls back to its own default denomination list: CoinBreakdown only
// overflows leftover value into a `gems` entry when denominations were left
// at that exact default, so passing an equivalent-looking array here would
// silently disable the gems overflow behavior.
const CONTEXT_CONFIGS = {
  character: { cascadeThreshold: 30 },
  treasure: { denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 },
};

/**
 * D&D-style currency model. Converts a raw copper-piece total into a
 * cascading coin denomination breakdown, using a different denomination set
 * and cascade threshold depending on the requested context (`character` or
 * `treasure`).
 */
export default class DndMoneyModel {
  /**
   * Transform a raw copper-piece total into a coin denomination breakdown
   * for the given context.
   *
   * @param {number} value - Total value, expressed in copper pieces.
   * @param {object} options - Transform options.
   * @param {string} options.context - Currency context (`character` or `treasure`).
   * @returns {{key: string, quantity: number}[]} Non-zero denomination
   *   entries in display order, lowest to highest denomination.
   */
  static transform(value, { context } = {}) {
    const config = CONTEXT_CONFIGS[context];

    if (!config) {
      throw new Error(`Unknown dnd money context: ${context}`);
    }

    return new CoinBreakdown(config).build(value);
  }
}

MoneyModelRegistry.register('dnd', DndMoneyModel);
