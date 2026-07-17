import CharacterMoneyBillHelper from './helpers/CharacterMoneyBillHelper.jsx';

/**
 * Deadlands character money display: a dark-green dollar-bill-styled box
 * showing the coins icon, a `$` sign, and the dollar/cent composition,
 * always shown in full, including when the total is 0.
 *
 * @param {object} props - Component props.
 * @param {number} props.money - Total money, expressed in cents.
 * @returns {React.ReactElement} Dollar bill box element.
 */
export default function CharacterMoneyBill({ money }) {
  return CharacterMoneyBillHelper.render(money);
}
