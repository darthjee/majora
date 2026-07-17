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
   * line, returning null when money is 0 (no denomination entries). When
   * `canEditMoney` is true, appends an "Edit" link/button beneath the
   * breakdown (issue #615), invoking `onEditMoney` when clicked.
   *
   * @param {number} money - Total money, expressed in the currency's lowest
   *   denomination (copper pieces for `dnd`, cents for `deadlands`).
   * @param {number} treasureValue - Treasure value, expressed in the
   *   currency's lowest denomination, rendered read-only alongside `money`
   *   (issue #616).
   * @param {string} gameType - Currency model name to resolve (e.g. `dnd`,
   *   `deadlands`).
   * @param {boolean} [canEditMoney] - Whether to render the "Edit" link
   *   beneath the breakdown. Defaults to `false`.
   * @param {Function} [onEditMoney] - Handler invoked when the "Edit" link
   *   is clicked.
   * @returns {React.ReactElement|null} Money breakdown element, or null.
   */
  static render(money, treasureValue, gameType, canEditMoney = false, onEditMoney) {
    const breakdown = CharacterMoneyHelper.#renderBreakdown(money, treasureValue, gameType);

    if (!canEditMoney) return breakdown;

    return (
      <>
        {breakdown}
        {CharacterMoneyHelper.#renderEditLink(onEditMoney)}
      </>
    );
  }

  /**
   * Render the money breakdown, without the optional edit link.
   *
   * @param {number} money - Total money, expressed in the currency's lowest
   *   denomination (copper pieces for `dnd`, cents for `deadlands`).
   * @param {number} treasureValue - Treasure value, expressed in the
   *   currency's lowest denomination, rendered read-only alongside `money`
   *   (issue #616).
   * @param {string} gameType - Currency model name to resolve (e.g. `dnd`,
   *   `deadlands`).
   * @returns {React.ReactElement|null} Money breakdown element, or null.
   */
  static #renderBreakdown(money, treasureValue, gameType) {
    if (gameType === 'dnd') {
      return <CharacterMoneyCoins money={money} treasureValue={treasureValue} />;
    }

    if (gameType === 'deadlands') {
      return <CharacterMoneyBill money={money} treasureValue={treasureValue} />;
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
   * Render the money "Edit" link/button (issue #615).
   *
   * @param {Function} onEditMoney - Handler invoked when the link is clicked.
   * @returns {React.ReactElement} Edit link element.
   */
  static #renderEditLink(onEditMoney) {
    return (
      <div>
        <button type="button" className="btn btn-link btn-sm p-0" onClick={onEditMoney}>
          {Translator.t('character_page.edit_money_button')}
        </button>
      </div>
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
