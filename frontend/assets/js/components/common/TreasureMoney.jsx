import TreasureMoneyHelper from './helpers/TreasureMoneyHelper.jsx';

/**
 * Treasure value display, formatted as a sentence-style denomination
 * breakdown ordered from highest to lowest denomination. Renders `0 GP`
 * (or the `deadlands` equivalent) when the value is 0.
 *
 * @param {object} props - Component props.
 * @param {number} props.value - Treasure value, expressed in the currency's
 *   lowest denomination.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`,
 *   `deadlands`). Defaults to `dnd`.
 * @returns {string} The formatted breakdown text.
 */
export default function TreasureMoney({ value, gameType = 'dnd' }) {
  return TreasureMoneyHelper.render(value, gameType);
}
