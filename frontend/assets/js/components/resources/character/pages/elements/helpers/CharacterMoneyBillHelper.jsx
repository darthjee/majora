import React from 'react';
import DeadlandsMoneyModel from '../../../../../../utils/money/DeadlandsMoneyModel.js';
import CharacterMoneyTreasureBill from '../CharacterMoneyTreasureBill.jsx';
import Icons from '../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the CharacterMoneyBill element.
 */
export default class CharacterMoneyBillHelper {
  /**
   * Render the dense (always cents/dollars) dollar-bill box for a raw cents
   * total, formatted as `$ dollars,cents` with cents zero-padded to two
   * digits, followed by the gold-background treasure box (issue #616),
   * which renders nothing when `treasureValue` is `0`.
   *
   * @param {number} money - Total money, expressed in cents.
   * @param {number} [treasureValue] - Treasure value, expressed in cents. Defaults to `0`.
   * @returns {React.ReactElement} Dollar bill box element.
   */
  static render(money, treasureValue = 0) {
    const { dollars, cents } = DeadlandsMoneyModel.formatDense(money);

    return (
      <div className="character-money-bill-group">
        <div className="character-money-bill">
          <i className={`bi ${Icons.cashCoin}`} aria-hidden="true"></i>
          <span className="character-money-bill-currency">$</span>
          <span className="character-money-bill-amount">{dollars},{cents}</span>
        </div>
        <CharacterMoneyTreasureBill treasureValue={treasureValue} />
      </div>
    );
  }
}
