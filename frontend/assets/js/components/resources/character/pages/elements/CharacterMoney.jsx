import CharacterMoneyHelper from './helpers/CharacterMoneyHelper.jsx';

/**
 * Character money breakdown display, rendered as a stack of four always-
 * present coin denomination boxes (CP/SP/GP/PP, including zero amounts) for
 * `dnd`, or a cascading cents/dollars line for `deadlands` (rendering
 * nothing when money is 0).
 *
 * @param {object} props - Component props.
 * @param {number} props.money - Total money, expressed in the currency's
 *   lowest denomination.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`,
 *   `deadlands`). Defaults to `dnd`.
 * @returns {React.ReactElement|null} Money breakdown element, or null.
 */
export default function CharacterMoney({ money, gameType = 'dnd' }) {
  return CharacterMoneyHelper.render(money, gameType);
}
