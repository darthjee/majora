import { useEffect, useRef, useState } from 'react';
import PreviewSectionHelper from './helpers/PreviewSectionHelper.jsx';
import { MAX_PREVIEW_ITEMS } from './characterPreviewConstants.js';

/**
 * Generic collapsible preview section listing a limited number of items with a clickable
 * heading, followed by a "See all" card. Agnostic of what an item's card looks like: callers
 * provide `renderItem` to render each sliced item (e.g. a `CharacterPreviewCard` or
 * `TreasurePreviewCard`).
 *
 * Owns its own collapse state: it starts at `defaultCollapsed`, then re-syncs to that prop
 * whenever it changes (e.g. once the caller's fetch resolves) — but only until the user manually
 * toggles the section, at which point their choice wins over any further `defaultCollapsed`
 * changes.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.items - List of items to preview.
 * @param {string} props.title - Section heading.
 * @param {object} props.seeAllCard - Data for the "See all" card.
 * @param {string} props.seeAllCard.href - Hash href for the "See all" card.
 * @param {string} props.seeAllCard.icon - Bootstrap icon class name (see `Icons.js`) for the
 *   "See all" card.
 * @param {number} [props.maxItems] - Maximum number of items shown before the "See all" card.
 *   Defaults to `MAX_PREVIEW_ITEMS`.
 * @param {Function} props.renderItem - Function `(item) => ReactElement` called for each sliced
 *   item, responsible for rendering that item's card (and its own `key`).
 * @param {string} [props.emptyText] - Muted paragraph shown above the row when `items` is empty.
 *   Omitted (no message rendered) when not given.
 * @param {object} props.sectionState - State driving the section's collapse behavior.
 * @param {boolean} props.sectionState.loading - Whether the caller's fetch is still in flight.
 * @param {number} props.sectionState.total - Total item count (from pagination metadata), shown
 *   in the title.
 * @param {boolean} props.sectionState.defaultCollapsed - Collapse state to adopt, and keep
 *   re-syncing to, until the user manually toggles the section.
 * @returns {React.ReactElement} Preview section element.
 */
export default function PreviewSection({
  items, title, seeAllCard, maxItems = MAX_PREVIEW_ITEMS, renderItem, emptyText, sectionState,
}) {
  const { loading, total, defaultCollapsed } = sectionState;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (!userInteractedRef.current) {
      setCollapsed(defaultCollapsed);
    }
  }, [defaultCollapsed]);

  const onToggle = () => {
    userInteractedRef.current = true;
    setCollapsed((current) => !current);
  };

  return PreviewSectionHelper.render(
    items, title, seeAllCard, maxItems, renderItem, emptyText, { loading, total, collapsed }, onToggle,
  );
}
