import ItemPreviewCardHelper from './helpers/ItemPreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single item's photo, styled like
 * `TreasurePreviewCard`, for use in preview sections (e.g. a character's
 * Items preview on their show page). When `href` is given, the whole card
 * links to it (e.g. the item's own detail page), matching
 * `TreasurePreviewCard`'s behavior.
 *
 * @param {object} props - Component props.
 * @param {object} props.item - CharacterItem preview data object, already
 *   fallback-resolved server-side against its linked `GameItem`.
 * @param {number} props.item.id - CharacterItem id.
 * @param {string} props.item.name - Item name.
 * @param {string} [props.item.description] - Item description.
 * @param {string|null} [props.item.photo_path] - Optional item photo path.
 * @param {string} [props.href] - Optional hash href the whole card links to.
 * @returns {React.ReactElement} Item preview card element.
 */
export default function ItemPreviewCard({ item, href }) {
  return ItemPreviewCardHelper.render(item, href);
}
