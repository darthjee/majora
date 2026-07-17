import CharacterMoneyCoinsHelper from './helpers/CharacterMoneyCoinsHelper.jsx';

/**
 * D&D character money display: a vertical stack of the four coin
 * denomination boxes (CP, SP, GP, PP), always shown in full, including
 * zero-quantity denominations.
 *
 * @param {object} props - Component props.
 * @param {number} props.money - Total money, expressed in copper pieces.
 * @param {number} [props.treasureValue] - Treasure value, expressed in copper pieces,
 *   rendered as an additional bright-red coin box (issue #616). Defaults to `0`.
 * @returns {React.ReactElement} Coin box stack element.
 */
export default function CharacterMoneyCoins({ money, treasureValue = 0 }) {
  return CharacterMoneyCoinsHelper.render(money, treasureValue);
}
