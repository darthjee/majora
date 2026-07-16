import CoinBreakdown from './CoinBreakdown.js';
import CoinPacker from './CoinPacker.js';
import MoneyModelRegistry from './MoneyModelRegistry.js';

// The `character` config intentionally passes its own explicit `denominations`
// array (rather than relying on CoinBreakdown's default denomination list
// reference) so that platinum absorbs all remaining value instead of
// overflowing into a `gems` entry: CoinBreakdown/CoinPacker only trigger that
// gems overflow special case when denominations were left at the exact
// default reference, so an equivalent-looking but distinct array here
// disables it.
const CONTEXT_CONFIGS = {
  character: { denominations: ['cp', 'sp', 'gp', 'pp'], cascadeThreshold: 30 },
  treasure: { denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 },
};

const DENOMINATION_KEYS_BY_CONTEXT = {
  character: ['cp', 'sp', 'gp', 'pp'],
  treasure: ['cp', 'sp', 'gp'],
};

const LABEL_KEYS = {
  cp: 'money.cp_abbreviation',
  sp: 'money.sp_abbreviation',
  gp: 'money.gp_abbreviation',
  pp: 'money.pp_abbreviation',
  gems: 'money.gp_in_gems',
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
   * Transform a raw copper-piece total into a dense (zero-inclusive) coin
   * denomination breakdown for the given context, keeping every
   * denomination entry even when its quantity is 0.
   *
   * @param {number} value - Total value, expressed in copper pieces.
   * @param {object} options - Transform options.
   * @param {string} options.context - Currency context (only `character` is supported).
   * @returns {{key: string, quantity: number}[]} All denomination entries in
   *   display order, lowest to highest denomination, including zero-quantity
   *   ones.
   */
  static transformDense(value, { context } = {}) {
    return new CoinBreakdown(DndMoneyModel.#resolveConfig(context)).buildDense(value);
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

  /**
   * Resolve the ordered denomination keys relevant for a given context, used
   * to seed a dense per-denomination breakdown (e.g. for the money edit
   * modal).
   *
   * @param {string} context - Currency context (`character` or `treasure`).
   * @returns {string[]} Denomination keys for the given context.
   */
  static denominationKeys(context) {
    const keys = DENOMINATION_KEYS_BY_CONTEXT[context];

    if (!keys) {
      throw new Error(`Unknown dnd money context: ${context}`);
    }

    return keys;
  }

  /**
   * Resolve the translation key for a denomination's display label.
   *
   * @param {string} denominationKey - Denomination key (e.g. `cp`, `gems`).
   * @returns {string} Translation key for the denomination's label.
   */
  static labelKey(denominationKey) {
    return LABEL_KEYS[denominationKey];
  }
}

MoneyModelRegistry.register('dnd', DndMoneyModel);
