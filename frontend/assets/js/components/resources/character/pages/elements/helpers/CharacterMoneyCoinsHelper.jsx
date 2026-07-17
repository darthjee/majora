import React from 'react';
import DndMoneyModel from '../../../../../../utils/money/DndMoneyModel.js';
import CharacterMoneyCoinBox from '../CharacterMoneyCoinBox.jsx';
import CharacterMoneyTreasureBox from '../CharacterMoneyTreasureBox.jsx';

/**
 * Rendering helper for the CharacterMoneyCoins element.
 */
export default class CharacterMoneyCoinsHelper {
  /**
   * Render the dense (always-four) coin box stack for a raw copper-piece
   * total, in `cp, sp, gp, pp` order, followed by the bright-red treasure
   * coin box (issue #616), which renders nothing when `treasureValue` is `0`.
   *
   * @param {number} money - Total money, expressed in copper pieces.
   * @param {number} [treasureValue] - Treasure value, expressed in copper
   *   pieces. Defaults to `0`.
   * @returns {React.ReactElement} Coin box stack element.
   */
  static render(money, treasureValue = 0) {
    const entries = DndMoneyModel.transformDense(money, { context: 'character' });

    return (
      <div className="character-money-coins">
        {entries.map((entry) => (
          <CharacterMoneyCoinBox key={entry.key} denominationKey={entry.key} quantity={entry.quantity} />
        ))}
        <CharacterMoneyTreasureBox treasureValue={treasureValue} />
      </div>
    );
  }
}
