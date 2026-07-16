import React from 'react';
import DndMoneyModel from '../../../../../../utils/money/DndMoneyModel.js';
import CharacterMoneyCoinBox from '../CharacterMoneyCoinBox.jsx';

/**
 * Rendering helper for the CharacterMoneyCoins element.
 */
export default class CharacterMoneyCoinsHelper {
  /**
   * Render the dense (always-four) coin box stack for a raw copper-piece
   * total, in `cp, sp, gp, pp` order.
   *
   * @param {number} money - Total money, expressed in copper pieces.
   * @returns {React.ReactElement} Coin box stack element.
   */
  static render(money) {
    const entries = DndMoneyModel.transformDense(money, { context: 'character' });

    return (
      <div className="character-money-coins">
        {entries.map((entry) => (
          <CharacterMoneyCoinBox key={entry.key} denominationKey={entry.key} quantity={entry.quantity} />
        ))}
      </div>
    );
  }
}
