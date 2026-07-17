import React from 'react';
import DeadlandsMoneyModel from '../../../../../../utils/money/DeadlandsMoneyModel.js';

/**
 * Rendering helper for the CharacterMoneyBill element.
 */
export default class CharacterMoneyBillHelper {
  /**
   * Render the dense (always cents/dollars) dollar-bill box for a raw cents
   * total, formatted as `$ dollars,cents` with cents zero-padded to two
   * digits.
   *
   * @param {number} money - Total money, expressed in cents.
   * @returns {React.ReactElement} Dollar bill box element.
   */
  static render(money) {
    const entries = DeadlandsMoneyModel.transformDense(money);
    const { cents, dollars } = entries.reduce((acc, entry) => ({ ...acc, [entry.key]: entry.quantity }), {});
    const paddedCents = String(cents).padStart(2, '0');

    return (
      <div className="character-money-bill">
        <span className="coin-icon" aria-hidden="true"></span>
        <span className="character-money-bill-currency">$</span>
        <span className="character-money-bill-amount">{dollars},{paddedCents}</span>
      </div>
    );
  }
}
