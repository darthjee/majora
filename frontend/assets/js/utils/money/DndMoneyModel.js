import CoinBreakdown from './CoinBreakdown.js';
import CoinPacker from './CoinPacker.js';
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
   * Resolve the denomination configuration for a given context.
   *
   * @param {string} context - Currency context (`character` or `treasure`).
   * @returns {object} The resolved context configuration.
   */
  static #resolveConfig(context) {
    const config = CONTEXT_CONFIGS[context];

    if (!config) {
      throw new Error(`Unknown dnd money context: ${context}`);
    }

    return config;
  }

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
    return new CoinBreakdown(DndMoneyModel.#resolveConfig(context)).build(value);
  }

  /**
   * Pack a coin denomination breakdown back into a raw copper-piece total
   * for the given context.
   *
   * @param {object} breakdown - Map of denomination key to quantity (e.g.
   *   `{ cp, sp, gp, pp, gems }`).
   * @param {object} options - Pack options.
   * @param {string} options.context - Currency context (`character` or `treasure`).
   * @returns {number} Total value, expressed in copper pieces.
   */
  static pack(breakdown, { context } = {}) {
    return new CoinPacker(DndMoneyModel.#resolveConfig(context)).pack(breakdown);
  }
}

MoneyModelRegistry.register('dnd', DndMoneyModel);
