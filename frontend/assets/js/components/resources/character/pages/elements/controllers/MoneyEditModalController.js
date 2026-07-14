import MoneyModelRegistry from '../../../../../../utils/money/MoneyModelRegistry.js';

const DENOMINATION_KEYS = ['cp', 'sp', 'gp', 'pp', 'gems'];
const MONEY_CONTEXT = 'character';

/**
 * Pure denomination-breakdown transformation logic for the
 * {@link MoneyEditModal} local breakdown state, kept independent of React so
 * it can be unit tested directly.
 */
export default class MoneyEditModalController {
  /**
   * Builds a dense local breakdown object seeded from the character's
   * current raw copper total, so every denomination row has a value even
   * when the current total has no coins of that denomination.
   *
   * @param {number|string} money - Character's current money, expressed in copper pieces.
   * @returns {{cp: number, sp: number, gp: number, pp: number, gems: number}} Dense breakdown object.
   */
  static seedBreakdown(money) {
    const entries = MoneyModelRegistry.resolve('dnd').transform(Number(money) || 0, { context: MONEY_CONTEXT });
    const dense = DENOMINATION_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

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
   * @returns {boolean} True when every denomination field is a non-negative integer.
   */
  static canConfirm(breakdown) {
    return DENOMINATION_KEYS.every((key) => Number.isInteger(breakdown[key]) && breakdown[key] >= 0);
  }

  /**
   * Computes the raw copper-piece total for the local breakdown object.
   *
   * @param {object} breakdown - Current local breakdown object.
   * @returns {number} Total value, expressed in copper pieces.
   */
  static computeTotal(breakdown) {
    return MoneyModelRegistry.resolve('dnd').pack(breakdown, { context: MONEY_CONTEXT });
  }
}
