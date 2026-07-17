import React from 'react';
import DeadlandsMoneyModel from '../../../../../../utils/money/DeadlandsMoneyModel.js';
import Translator from '../../../../../../i18n/Translator.js';

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

    const entries = DeadlandsMoneyModel.transformDense(treasureValue);
    const { cents, dollars } = entries.reduce((acc, entry) => ({ ...acc, [entry.key]: entry.quantity }), {});
    const paddedCents = String(cents).padStart(2, '0');

    return (
      <div className="character-money-bill character-money-bill-treasure">
        <span className="coin-icon" aria-hidden="true"></span>
        <span className="character-money-bill-currency">$</span>
        <span className="character-money-bill-amount">
          {dollars},{paddedCents} {Translator.t('money.in_gems')}
        </span>
      </div>
    );
  }
}
