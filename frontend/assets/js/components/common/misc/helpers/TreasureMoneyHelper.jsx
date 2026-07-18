import MoneyModelRegistry from '../../../../utils/money/MoneyModelRegistry.js';
import DeadlandsMoneyModel from '../../../../utils/money/DeadlandsMoneyModel.js';
import '../../../../utils/money/DndMoneyModel.js';
import Translator from '../../../../i18n/Translator.js';

/**
 * Rendering helper for the TreasureMoney element.
 */
export default class TreasureMoneyHelper {
  /**
   * Render a treasure value as display text. For `deadlands`, renders the
   * compact numeric format `$ <dollars>,<cents>` (cents zero-padded to two
   * digits, e.g. `$ 0,00`). For every other game type (e.g. `dnd`), renders
   * a sentence-style denomination breakdown, ordered from highest to lowest
   * denomination (e.g. CP/SP/GP). A value of 0 renders as `0` of the
   * model's highest treasure-context denomination (e.g. `0 GP`).
   *
   * @param {number} [value] - Treasure value, expressed in the currency's
   *   lowest denomination.
   * @param {string} [gameType] - Currency model name (e.g. `dnd`,
   *   `deadlands`). Defaults to `dnd`.
   * @returns {string} The formatted treasure value text.
   */
  static render(value = 0, gameType = 'dnd') {
    if (gameType === 'deadlands') {
      return TreasureMoneyHelper.#renderDeadlands(value);
    }

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
   * Render a treasure value using the deadlands numeric format
   * (`$ <dollars>,<cents>`).
   *
   * @param {number} value - Treasure value, expressed in cents.
   * @returns {string} The formatted `$ dollars,cents` text.
   */
  static #renderDeadlands(value) {
    const { dollars, cents } = DeadlandsMoneyModel.formatDense(value);

    return `$ ${dollars},${cents}`;
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
