import PreviewSectionHelper from './helpers/PreviewSectionHelper.jsx';
import { MAX_PREVIEW_ITEMS } from './characterPreviewConstants.js';

/**
 * Generic preview section listing a limited number of items with a heading,
 * followed by a "See all" card. Agnostic of what an item's card looks like:
 * callers provide `renderItem` to render each sliced item (e.g. a
 * `CharacterPreviewCard` or `TreasurePreviewCard`).
 *
 * @param {object} props - Component props.
 * @param {object[]} props.items - List of items to preview.
 * @param {string} props.title - Section heading.
 * @param {string} props.seeAllHref - Hash href for the "See all" card.
 * @param {string} props.icon - Bootstrap icon class name (see `Icons.js`) for the "See all" card.
 * @param {number} [props.maxItems] - Maximum number of items shown before the "See all" card.
 *   Defaults to `MAX_PREVIEW_ITEMS`.
 * @param {Function} props.renderItem - Function `(item) => ReactElement` called for each sliced
 *   item, responsible for rendering that item's card (and its own `key`).
 * @param {string} [props.emptyText] - Muted paragraph shown above the row when `items` is empty.
 *   Omitted (no message rendered) when not given.
 * @returns {React.ReactElement} Preview section element.
 */
export default function PreviewSection({
  items, title, seeAllHref, icon, maxItems = MAX_PREVIEW_ITEMS, renderItem, emptyText,
}) {
  return PreviewSectionHelper.render(items, title, seeAllHref, icon, maxItems, renderItem, emptyText);
}
