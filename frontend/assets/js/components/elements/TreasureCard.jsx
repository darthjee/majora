import TreasureCardHelper from './helpers/TreasureCardHelper.jsx';

/**
 * Bootstrap card representing a single treasure.
 *
 * @param {object} props - Component props.
 * @param {object} props.treasure - Treasure data object.
 * @param {number} props.treasure.id - Treasure ID.
 * @param {string} props.treasure.name - Treasure name.
 * @param {number} props.treasure.value - Treasure value.
 * @returns {React.ReactElement} Treasure card element.
 */
export default function TreasureCard({ treasure }) {
  return TreasureCardHelper.render(treasure);
}
