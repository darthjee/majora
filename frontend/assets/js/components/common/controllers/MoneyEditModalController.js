import MoneyModelRegistry from '../../../utils/money/MoneyModelRegistry.js';

const DEFAULT_CONTEXT = 'character';

const DENOMINATION_KEYS_BY_CONTEXT = {
  character: ['cp', 'sp', 'gp', 'pp', 'gems'],
  treasure: ['cp', 'sp', 'gp'],
};

/**
 * Pure denomination-breakdown transformation logic for the
 * {@link MoneyEditModal} local breakdown state, kept independent of React so
 * it can be unit tested directly. Supports multiple money contexts (e.g.
 * `character` with CP/SP/GP/PP/gems, `treasure` with CP/SP/GP only).
 */
export default class MoneyEditModalController {
  /**
   * Resolve the denomination keys relevant for a given money context.
   *
   * @param {string} context - Money context (`character` or `treasure`).
   * @returns {string[]} Denomination keys for the given context.
   */
  static denominationKeys(context = DEFAULT_CONTEXT) {
    return DENOMINATION_KEYS_BY_CONTEXT[context] ?? DENOMINATION_KEYS_BY_CONTEXT[DEFAULT_CONTEXT];
  }

  /**
   * Builds a dense local breakdown object seeded from the current raw copper
   * total, so every denomination row has a value even when the current total
   * has no coins of that denomination.
   *
   * @param {number|string} money - Current money, expressed in copper pieces.
   * @param {string} [context] - Money context (`character` or `treasure`).
   * @returns {object} Dense breakdown object keyed by denomination.
   */
  static seedBreakdown(money, context = DEFAULT_CONTEXT) {
    const entries = MoneyModelRegistry.resolve('dnd').transform(Number(money) || 0, { context });
    const keys = MoneyEditModalController.denominationKeys(context);
    const dense = keys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

    return entries.reduce((acc, entry) => ({ ...acc, [entry.key]: entry.quantity }), dense);
  }

  /**
   * Merges a single field change into the local breakdown object.
   *
   * @param {object} breakdown - Current local breakdown object.
   * @param {string} key - Denomination key being updated.
   * @param {number} value - New value for the given denomination.
   * @returns {object} Breakdown object with the field updated.
   */
  static updateField(breakdown, key, value) {
    return { ...breakdown, [key]: value };
  }

  /**
   * Determines whether every denomination field is a non-negative integer,
   * i.e. whether the modal's local breakdown can be confirmed.
   *
   * @param {object} breakdown - Current local breakdown object.
   * @param {string} [context] - Money context (`character` or `treasure`).
   * @returns {boolean} True when every denomination field is a non-negative integer.
   */
  static canConfirm(breakdown, context = DEFAULT_CONTEXT) {
    return MoneyEditModalController.denominationKeys(context)
      .every((key) => Number.isInteger(breakdown[key]) && breakdown[key] >= 0);
  }

  /**
   * Computes the raw copper-piece total for the local breakdown object.
   *
   * @param {object} breakdown - Current local breakdown object.
   * @param {string} [context] - Money context (`character` or `treasure`).
   * @returns {number} Total value, expressed in copper pieces.
   */
  static computeTotal(breakdown, context = DEFAULT_CONTEXT) {
    return MoneyModelRegistry.resolve('dnd').pack(breakdown, { context });
  }
}
