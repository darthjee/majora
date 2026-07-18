import TreasurePreviewCardHelper from './helpers/TreasurePreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single treasure's photo, styled like
 * `SeeAllCard`/`CharacterPreviewCard`, for use in preview sections (e.g. a
 * character's Treasures preview on their show page). Distinct from the
 * shared `TreasureCard`, which keeps its always-visible name/value text for
 * the full treasures list pages.
 *
 * @param {object} props - Component props.
 * @param {object} props.treasure - Treasure data object.
 * @param {number} props.treasure.id - Treasure ID.
 * @param {string} props.treasure.name - Treasure name.
 * @param {number} props.treasure.value - Treasure value.
 * @param {string} [props.treasure.game_type] - Currency model name (e.g. `dnd`, `deadlands`)
 *   determining which denominations the value is displayed in. Defaults to `dnd`.
 * @param {string|null} [props.treasure.photo_path] - Optional treasure photo path.
 * @param {number|null} [props.quantity] - Owned quantity, appended to the tooltip content as a
 *   `×<quantity>` suffix when greater than 1.
 * @returns {React.ReactElement} Treasure preview card element.
 */
export default function TreasurePreviewCard({ treasure, quantity }) {
  return TreasurePreviewCardHelper.render(treasure, quantity);
}
