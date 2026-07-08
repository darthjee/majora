import TreasureMoneyHelper from './helpers/TreasureMoneyHelper.jsx';

/**
 * Treasure value display, formatted as a sentence-style CP/SP/GP breakdown
 * ordered from highest to lowest denomination. Renders `0 GP` when the value
 * is 0.
 *
 * @param {object} props - Component props.
 * @param {number} props.value - Treasure value, expressed in copper pieces.
 * @returns {string} The formatted breakdown text.
 */
export default function TreasureMoney({ value }) {
  return TreasureMoneyHelper.render(value);
}
