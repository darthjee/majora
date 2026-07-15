import TreasureCardHelper from './helpers/TreasureCardHelper.jsx';

/**
 * Bootstrap card representing a single treasure.
 *
 * @param {object} props - Component props.
 * @param {object} props.treasure - Treasure data object.
 * @param {number} props.treasure.id - Treasure ID.
 * @param {string} props.treasure.name - Treasure name.
 * @param {number} props.treasure.value - Treasure value.
 * @param {string} [props.treasure.game_type] - Currency model name (e.g. `dnd`, `deadlands`)
 *   determining which denominations the value is displayed in. Defaults to `dnd`.
 * @param {string|null} [props.treasure.photo_path] - Optional treasure photo path.
 * @param {number|null} [props.treasure.available_units] - Units currently available within the
 *   game, when the treasure is capped. `null`/absent when unlimited.
 * @param {number|null} [props.treasure.max_units] - Maximum units obtainable within the game,
 *   when the treasure is capped. `null`/absent when unlimited; when set, an availability line
 *   (`Available: {available} / {max}`) is shown in the card body.
 * @param {boolean} [props.canManage] - Whether the current user may upload a photo and edit this treasure.
 * @param {Function} [props.onUploadClick] - Handler invoked with the treasure when the upload button is clicked.
 * @param {string} [props.editHref] - Hash path to the treasure's edit page. When omitted, no
 *   edit link is rendered even if `canManage` is true (used by the global, ownerless treasures
 *   page, which has no game-scoped edit route).
 * @param {number|null} [props.quantity] - Owned quantity, rendered as a `×<quantity>` badge
 *   when greater than 1.
 * @returns {React.ReactElement} Treasure card element.
 */
export default function TreasureCard({
  treasure, canManage, onUploadClick, editHref, quantity,
}) {
  return TreasureCardHelper.render(treasure, canManage, onUploadClick, editHref, quantity);
}
