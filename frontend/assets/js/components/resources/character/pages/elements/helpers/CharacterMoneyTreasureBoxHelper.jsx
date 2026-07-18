import React from 'react';
import DndMoneyModel from '../../../../../../utils/money/DndMoneyModel.js';
import Translator from '../../../../../../i18n/Translator.js';
import Icons from '../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the CharacterMoneyTreasureBox element.
 */
export default class CharacterMoneyTreasureBoxHelper {
  /**
   * Render the bright-red D&D treasure coin box for a raw copper-piece
   * treasure value, using the `treasure` context's cascading CP -> SP -> GP
   * breakdown (max of 10 per denomination, GP absorbing the remainder).
   * Non-zero denomination entries are joined with `" | "` and suffixed with
   * the translated `money.in_gems` label. Renders nothing when the value is
   * `0`.
   *
   * @param {number} treasureValue - Treasure value, expressed in copper pieces.
   * @returns {React.ReactElement|null} Treasure box element, or null.
   */
  static render(treasureValue) {
    if (!treasureValue) return null;

    const entries = DndMoneyModel.transform(treasureValue, { context: 'treasure' });
    const breakdown = entries.map((entry) => CharacterMoneyTreasureBoxHelper.#formatEntry(entry)).join(' | ');

    return (
      <div className="coin-box coin-box-treasure">
        <i className={`bi ${Icons.gem}`} aria-hidden="true"></i>
        <span className="coin-box-amount">{breakdown} {Translator.t('money.in_gems')}</span>
      </div>
    );
  }

  /**
   * Format a single coin denomination entry into its display string.
   *
   * @param {{key: string, quantity: number}} entry - Denomination entry.
   * @returns {string} Formatted entry (e.g. `20 GP`).
   */
  static #formatEntry(entry) {
    return `${entry.quantity} ${Translator.t(DndMoneyModel.labelKey(entry.key))}`;
  }
}
