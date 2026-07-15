import MoneyModelRegistry from '../../../utils/money/MoneyModelRegistry.js';
import '../../../utils/money/DndMoneyModel.js';
import '../../../utils/money/DeadlandsMoneyModel.js';

const DEFAULT_CONTEXT = 'character';
const DEFAULT_GAME_TYPE = 'dnd';

/**
 * Pure denomination-breakdown transformation logic for the
 * {@link MoneyEditModal} local breakdown state, kept independent of React so
 * it can be unit tested directly. Supports multiple money contexts (e.g.
 * `character` with CP/SP/GP/PP, `treasure` with CP/SP/GP only) and
 * multiple currency models (`dnd`, `deadlands`), resolved via
 * {@link MoneyModelRegistry}.
 */
export default class MoneyEditModalController {
  /**
   * Resolve the denomination keys relevant for a given money context and
   * currency model.
   *
   * @param {string} [context] - Money context (`character` or `treasure`).
   * @param {string} [gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @returns {string[]} Denomination keys for the given context.
   */
  static denominationKeys(context = DEFAULT_CONTEXT, gameType = DEFAULT_GAME_TYPE) {
    return MoneyModelRegistry.resolve(gameType).denominationKeys(context);
  }

  /**
   * Builds a dense local breakdown object seeded from the current raw money
   * total, so every denomination row has a value even when the current total
   * has none of that denomination.
   *
   * @param {number|string} money - Current money, expressed in the
   *   currency's lowest denomination.
   * @param {string} [context] - Money context (`character` or `treasure`).
   * @param {string} [gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @returns {object} Dense breakdown object keyed by denomination.
   */
  static seedBreakdown(money, context = DEFAULT_CONTEXT, gameType = DEFAULT_GAME_TYPE) {
    const entries = MoneyModelRegistry.resolve(gameType).transform(Number(money) || 0, { context });
    const keys = MoneyEditModalController.denominationKeys(context, gameType);
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
   * @param {string} [gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @returns {boolean} True when every denomination field is a non-negative integer.
   */
  static canConfirm(breakdown, context = DEFAULT_CONTEXT, gameType = DEFAULT_GAME_TYPE) {
    return MoneyEditModalController.denominationKeys(context, gameType)
      .every((key) => Number.isInteger(breakdown[key]) && breakdown[key] >= 0);
  }

  /**
   * Computes the raw money total for the local breakdown object.
   *
   * @param {object} breakdown - Current local breakdown object.
   * @param {string} [context] - Money context (`character` or `treasure`).
   * @param {string} [gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @returns {number} Total value, expressed in the currency's lowest denomination.
   */
  static computeTotal(breakdown, context = DEFAULT_CONTEXT, gameType = DEFAULT_GAME_TYPE) {
    return MoneyModelRegistry.resolve(gameType).pack(breakdown, { context });
  }
}
