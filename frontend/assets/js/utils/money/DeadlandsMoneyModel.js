import MoneyModelRegistry from './MoneyModelRegistry.js';

const DENOMINATION_KEYS = ['cents', 'dollars'];

const LABEL_KEYS = {
  cents: 'money.cents_abbreviation',
  dollars: 'money.dollars_abbreviation',
};

/**
 * Deadlands-style currency model. Converts a raw cents total into a
 * cents/dollars breakdown, with a single boundary at 100 cents = 1 dollar.
 * Unlike {@link DndMoneyModel}, the `context` option does not change the
 * breakdown behavior (character and treasure pages use the same rule) — it
 * is accepted for interface symmetry only, and ignored.
 */
export default class DeadlandsMoneyModel {
  /**
   * Transform a raw cents total into a cents/dollars breakdown.
   *
   * @param {number} value - Total value, expressed in cents.
   * @param {object} [_options] - Transform options, accepted for interface
   *   symmetry with {@link DndMoneyModel} and ignored.
   * @returns {{key: string, quantity: number}[]} Non-zero denomination
   *   entries, lowest to highest denomination.
   */
  static transform(value = 0, _options = {}) {
    const dollars = Math.floor(value / 100);
    const cents = value % 100;

    return [
      { key: 'cents', quantity: cents },
      { key: 'dollars', quantity: dollars },
    ].filter((entry) => entry.quantity !== 0);
  }

  /**
   * Transform a raw cents total into a dense (zero-inclusive) cents/dollars
   * breakdown, keeping both entries even when their quantity is 0.
   *
   * @param {number} value - Total value, expressed in cents.
   * @param {object} [_options] - Transform options, accepted for interface
   *   symmetry with {@link DndMoneyModel} and ignored.
   * @returns {{key: string, quantity: number}[]} Both denomination entries,
   *   lowest to highest denomination, including zero-quantity ones.
   */
  static transformDense(value = 0, _options = {}) {
    const dollars = Math.floor(value / 100);
    const cents = value % 100;

    return [
      { key: 'cents', quantity: cents },
      { key: 'dollars', quantity: dollars },
    ];
  }

  /**
   * Pack a cents/dollars breakdown back into a raw cents total.
   *
   * @param {object} [breakdown] - Map of denomination key to quantity (e.g.
   *   `{ cents, dollars }`). Missing or non-numeric fields are treated as 0.
   * @param {object} [_options] - Pack options, accepted for interface
   *   symmetry with {@link DndMoneyModel} and ignored.
   * @returns {number} Total value, expressed in cents.
   */
  static pack(breakdown = {}, _options = {}) {
    return (Number(breakdown.cents) || 0) + (Number(breakdown.dollars) || 0) * 100;
  }

  /**
   * Resolve the ordered denomination keys, used to seed a dense
   * per-denomination breakdown (e.g. for the money edit modal). Always
   * `cents`/`dollars`, regardless of context.
   *
   * @param {string} [_context] - Currency context, accepted for interface
   *   symmetry with {@link DndMoneyModel} and ignored.
   * @returns {string[]} Denomination keys.
   */
  static denominationKeys(_context) {
    return DENOMINATION_KEYS;
  }

  /**
   * Resolve the translation key for a denomination's display label.
   *
   * @param {string} denominationKey - Denomination key (`cents` or `dollars`).
   * @returns {string} Translation key for the denomination's label.
   */
  static labelKey(denominationKey) {
    return LABEL_KEYS[denominationKey];
  }
}

MoneyModelRegistry.register('deadlands', DeadlandsMoneyModel);
