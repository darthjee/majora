import React from 'react';
import DeadlandsMoneyModel from '../../../../../../utils/money/DeadlandsMoneyModel.js';
import Translator from '../../../../../../i18n/Translator.js';
import Icons from '../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the CharacterMoneyTreasureBill element.
 */
export default class CharacterMoneyTreasureBillHelper {
  /**
   * Render the gold-background, white-text Deadlands treasure box for a raw
   * cents treasure value, formatted as `$ dollars,cents` (cents zero-padded
   * to two digits, same split as {@link CharacterMoneyBillHelper}) and
   * suffixed with the translated `money.in_gems` label. Renders nothing when
   * the value is `0`.
   *
   * @param {number} treasureValue - Treasure value, expressed in cents.
   * @returns {React.ReactElement|null} Treasure bill box element, or null.
   */
  static render(treasureValue) {
    if (!treasureValue) return null;

    const { dollars, cents } = DeadlandsMoneyModel.formatDense(treasureValue);

    return (
      <div className="character-money-bill character-money-bill-treasure">
        <i className={`bi ${Icons.gem}`} aria-hidden="true"></i>
        <span className="character-money-bill-currency">$</span>
        <span className="character-money-bill-amount">
          {dollars},{cents} {Translator.t('money.in_gems')}
        </span>
      </div>
    );
  }
}
