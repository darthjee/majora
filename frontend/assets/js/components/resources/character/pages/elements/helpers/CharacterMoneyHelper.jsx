import React from 'react';
import MoneyModelRegistry from '../../../../../../utils/money/MoneyModelRegistry.js';
import '../../../../../../utils/money/DndMoneyModel.js';
import '../../../../../../utils/money/DeadlandsMoneyModel.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterMoney element.
 */
export default class CharacterMoneyHelper {
  /**
   * Render the character's money as a cascading coin denomination
   * breakdown line. Renders null when money is 0 (no denomination entries).
   *
   * @param {number} money - Total money, expressed in the currency's lowest
   *   denomination (copper pieces for `dnd`, cents for `deadlands`).
   * @param {string} gameType - Currency model name to resolve (e.g. `dnd`,
   *   `deadlands`).
   * @returns {React.ReactElement|null} Money breakdown paragraph, or null.
   */
  static render(money, gameType) {
    const model = MoneyModelRegistry.resolve(gameType);
    const entries = model.transform(money, { context: 'character' });

    if (entries.length === 0) return null;

    return (
      <p className="character-money">
        {entries.map((entry) => CharacterMoneyHelper.#formatEntry(entry, model)).join(' | ')}
      </p>
    );
  }

  /**
   * Format a single coin denomination entry into its display string.
   *
   * @param {{key: string, quantity: number}} entry - Denomination entry.
   * @param {Function} model - Resolved money model, used to look up the
   *   denomination's label translation key.
   * @returns {string} Formatted entry (e.g. `20 CP` or `39 PP`).
   */
  static #formatEntry(entry, model) {
    return `${entry.quantity} ${Translator.t(model.labelKey(entry.key))}`;
  }
}
