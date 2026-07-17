import React from 'react';
import MoneyModelRegistry from '../../../../../../utils/money/MoneyModelRegistry.js';
import '../../../../../../utils/money/DndMoneyModel.js';
import '../../../../../../utils/money/DeadlandsMoneyModel.js';
import Translator from '../../../../../../i18n/Translator.js';
import CharacterMoneyCoins from '../CharacterMoneyCoins.jsx';
import CharacterMoneyBill from '../CharacterMoneyBill.jsx';

/**
 * Rendering helper for the CharacterMoney element.
 */
export default class CharacterMoneyHelper {
  /**
   * Render the character's money. For `dnd`, renders a dense, always-four
   * coin box stack (CP/SP/GP/PP, including zero amounts). For `deadlands`,
   * renders a dense dollar-bill box (cents/dollars, including zero amounts).
   * For any other game type, renders a cascading coin denomination breakdown
   * line, returning null when money is 0 (no denomination entries).
   *
   * @param {number} money - Total money, expressed in the currency's lowest
   *   denomination (copper pieces for `dnd`, cents for `deadlands`).
   * @param {string} gameType - Currency model name to resolve (e.g. `dnd`,
   *   `deadlands`).
   * @returns {React.ReactElement|null} Money breakdown element, or null.
   */
  static render(money, gameType) {
    if (gameType === 'dnd') {
      return <CharacterMoneyCoins money={money} />;
    }

    if (gameType === 'deadlands') {
      return <CharacterMoneyBill money={money} />;
    }

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
