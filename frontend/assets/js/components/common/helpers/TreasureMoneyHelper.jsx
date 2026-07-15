import MoneyModelRegistry from '../../../utils/money/MoneyModelRegistry.js';
import '../../../utils/money/DndMoneyModel.js';
import '../../../utils/money/DeadlandsMoneyModel.js';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the TreasureMoney element.
 */
export default class TreasureMoneyHelper {
  /**
   * Render a treasure value as a sentence-style denomination breakdown,
   * ordered from highest to lowest denomination (e.g. CP/SP/GP for `dnd`,
   * Cents/Dollars for `deadlands`). A value of 0 renders as `0` of the
   * model's highest treasure-context denomination (e.g. `0 GP`).
   *
   * @param {number} [value] - Treasure value, expressed in the currency's
   *   lowest denomination.
   * @param {string} [gameType] - Currency model name (e.g. `dnd`,
   *   `deadlands`). Defaults to `dnd`.
   * @returns {string} The formatted breakdown string (e.g. `1000 GP, 5 SP and 2 CP`).
   */
  static render(value = 0, gameType = 'dnd') {
    const model = MoneyModelRegistry.resolve(gameType);
    const entries = model.transform(value, { context: 'treasure' });

    if (entries.length === 0) {
      return TreasureMoneyHelper.#formatEntry(TreasureMoneyHelper.#zeroEntry(model), model);
    }

    return TreasureMoneyHelper.#joinEntries(
      entries.reverse().map((entry) => TreasureMoneyHelper.#formatEntry(entry, model))
    );
  }

  /**
   * Build the zero-value fallback entry, using the highest denomination the
   * model renders in the treasure context.
   *
   * @param {Function} model - Resolved money model.
   * @returns {{key: string, quantity: number}} Zeroed fallback entry.
   */
  static #zeroEntry(model) {
    const keys = model.denominationKeys('treasure');

    return { key: keys[keys.length - 1], quantity: 0 };
  }

  /**
   * Format a single coin denomination entry into its display string.
   *
   * @param {{key: string, quantity: number}} entry - Denomination entry.
   * @param {Function} model - Resolved money model, used to look up the
   *   denomination's label translation key.
   * @returns {string} Formatted entry (e.g. `5 SP`).
   */
  static #formatEntry(entry, model) {
    return `${entry.quantity} ${Translator.t(model.labelKey(entry.key))}`;
  }

  /**
   * Join formatted denomination strings with commas, using a trailing "and"
   * before the last entry.
   *
   * @param {string[]} formattedEntries - Formatted denomination strings.
   * @returns {string} The joined string.
   */
  static #joinEntries(formattedEntries) {
    if (formattedEntries.length <= 1) {
      return formattedEntries.join('');
    }

    const last = formattedEntries[formattedEntries.length - 1];
    const rest = formattedEntries.slice(0, -1);

    return `${rest.join(', ')} and ${last}`;
  }
}
