import CharacterMoneyHelper from './helpers/CharacterMoneyHelper.jsx';

/**
 * Character money breakdown display, rendered as a cascading
 * platinum/gold/silver/copper/gems line. Renders nothing when money is 0.
 *
 * @param {object} props - Component props.
 * @param {number} props.money - Total money, expressed in copper pieces.
 * @returns {React.ReactElement|null} Money breakdown element, or null.
 */
export default function CharacterMoney({ money }) {
  return CharacterMoneyHelper.render(money);
}
