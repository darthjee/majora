import React from 'react';
import Translator from '../../../../../i18n/Translator.js';
import DndMoneyModel from '../../../../../utils/money/DndMoneyModel.js';

/**
 * A single D&D coin denomination box: icon + translated abbreviation +
 * amount, colored per denomination via a `coin-box-{key}` CSS class. Always
 * renders, even when the amount is 0.
 *
 * @param {object} props - Component props.
 * @param {string} props.denominationKey - Denomination key (`cp`, `sp`, `gp` or `pp`).
 * @param {number} [props.quantity] - Coin amount for this denomination. Defaults to `0`.
 * @returns {React.ReactElement} Coin box element.
 */
export default function CharacterMoneyCoinBox({ denominationKey, quantity = 0 }) {
  return (
    <div className={`coin-box coin-box-${denominationKey}`}>
      <span className="coin-icon" aria-hidden="true"></span>
      <span className="coin-box-abbreviation">{Translator.t(DndMoneyModel.labelKey(denominationKey))}</span>
      <span className="coin-box-amount">{quantity || 0}</span>
    </div>
  );
}
