import MoneyModelRegistry from '../../../utils/money/MoneyModelRegistry.js';
import '../../../utils/money/DndMoneyModel.js';
import Translator from '../../../i18n/Translator.js';

const ABBREVIATION_KEYS = {
  cp: 'money.cp_abbreviation',
  sp: 'money.sp_abbreviation',
  gp: 'money.gp_abbreviation',
};

/**
 * Rendering helper for the TreasureMoney element.
 */
export default class TreasureMoneyHelper {
  /**
   * Render a treasure value as a sentence-style CP/SP/GP breakdown, ordered
   * from highest to lowest denomination. A value of 0 renders as `0 GP`.
   *
   * @param {number} [value] - Treasure value, expressed in copper pieces.
   * @returns {string} The formatted breakdown string (e.g. `1000 GP, 5 SP and 2 CP`).
   */
  static render(value = 0) {
    const model = MoneyModelRegistry.resolve('dnd');
    const entries = model.transform(value, { context: 'treasure' });

    if (entries.length === 0) {
      return TreasureMoneyHelper.#formatEntry({ key: 'gp', quantity: 0 });
    }

    return TreasureMoneyHelper.#joinEntries(
      entries.reverse().map(TreasureMoneyHelper.#formatEntry)
    );
  }

  /**
   * Format a single coin denomination entry into its display string.
   *
   * @param {{key: string, quantity: number}} entry - Denomination entry.
   * @returns {string} Formatted entry (e.g. `5 SP`).
   */
  static #formatEntry(entry) {
    return `${entry.quantity} ${Translator.t(ABBREVIATION_KEYS[entry.key])}`;
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
