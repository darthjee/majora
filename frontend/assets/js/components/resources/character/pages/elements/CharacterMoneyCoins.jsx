import CharacterMoneyCoinsHelper from './helpers/CharacterMoneyCoinsHelper.jsx';

/**
 * D&D character money display: a vertical stack of the four coin
 * denomination boxes (CP, SP, GP, PP), always shown in full, including
 * zero-quantity denominations.
 *
 * @param {object} props - Component props.
 * @param {number} props.money - Total money, expressed in copper pieces.
 * @returns {React.ReactElement} Coin box stack element.
 */
export default function CharacterMoneyCoins({ money }) {
  return CharacterMoneyCoinsHelper.render(money);
}
