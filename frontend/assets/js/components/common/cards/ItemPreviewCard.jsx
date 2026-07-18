import ItemPreviewCardHelper from './helpers/ItemPreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single item's photo, styled like
 * `TreasurePreviewCard`, for use in preview sections (e.g. a character's
 * Items preview on their show page). Unlike `TreasurePreviewCard`, the card
 * is not a link: items have no standalone detail page in scope.
 *
 * @param {object} props - Component props.
 * @param {object} props.item - CharacterItem preview data object, already
 *   fallback-resolved server-side against its linked `GameItem`.
 * @param {number} props.item.id - CharacterItem id.
 * @param {string} props.item.name - Item name.
 * @param {string} [props.item.description] - Item description.
 * @param {string|null} [props.item.photo_path] - Optional item photo path.
 * @returns {React.ReactElement} Item preview card element.
 */
export default function ItemPreviewCard({ item }) {
  return ItemPreviewCardHelper.render(item);
}
