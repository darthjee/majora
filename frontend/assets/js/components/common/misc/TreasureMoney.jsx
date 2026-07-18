import TreasureMoneyHelper from './helpers/TreasureMoneyHelper.jsx';

/**
 * Treasure value display. For `deadlands`, renders the compact numeric
 * format `$ <dollars>,<cents>` (e.g. `$ 0,00`). For every other game type
 * (e.g. `dnd`), renders a sentence-style denomination breakdown ordered
 * from highest to lowest denomination, rendering `0 GP` when the value is 0.
 *
 * @param {object} props - Component props.
 * @param {number} props.value - Treasure value, expressed in the currency's
 *   lowest denomination.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`,
 *   `deadlands`). Defaults to `dnd`.
 * @returns {string} The formatted treasure value text.
 */
export default function TreasureMoney({ value, gameType = 'dnd' }) {
  return TreasureMoneyHelper.render(value, gameType);
}
