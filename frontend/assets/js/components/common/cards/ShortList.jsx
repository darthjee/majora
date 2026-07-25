import { useEffect, useMemo, useState } from 'react';
import ShortListController from './controllers/ShortListController.js';
import PreviewSection from './PreviewSection.jsx';
import shortListResourceConfig from './shortListResourceConfig.js';
import { MAX_PREVIEW_ITEMS } from './characterPreviewConstants.js';
import Translator from '../../../i18n/Translator.js';

/**
 * Self-fetching preview-list element rendered on show pages' right column, replacing the
 * former per-resource `GamePreviewSections`/`CharacterPreviewSectionsSlot` components. Fetches
 * its own items through `RequestStore` (via `ShortListController`), driven entirely by the
 * per-resource behavior declared in `shortListResourceConfig`: fetch params, "See all" href,
 * click action (`navigate` to the item's own detail page, or `none`), and how to render each
 * item's card.
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering
 *   context spread in (`game_slug`, `id`, `is_pc`, `game_type`, ...).
 * @param {string} props.resource - Resource type key into `shortListResourceConfig`
 *   (`'pc'`, `'npc'`, `'treasure'`, `'item'`, `'document'`).
 * @param {number} [props.maxItems] - Maximum number of items shown before the "See all" card.
 *   Defaults to `MAX_PREVIEW_ITEMS`.
 * @returns {React.ReactElement|null} The preview section element, or `null` while loading.
 */
export default function ShortList({ resource, maxItems = MAX_PREVIEW_ITEMS, ...context }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const config = shortListResourceConfig[resource];

  const controller = useMemo(
    () => new ShortListController(resource, setItems, setLoading),
    [resource],
  );

  // Only fetch-affecting fields are named as effect dependencies (the full `context` is a fresh
  // object every render, being built from a rest-spread of props); a fresh, minimal object built
  // from just those fields is passed to `buildEffect`, rather than referencing the outer
  // `context` variable, so this effect only re-runs when a fetch-affecting field actually changes.
  const { game_slug: gameSlug, id, is_pc: isPc } = context;

  useEffect(
    () => controller.buildEffect({ game_slug: gameSlug, id, is_pc: isPc }, maxItems)(),
    [controller, maxItems, gameSlug, id, isPc],
  );

  if (loading) {
    return null;
  }

  return (
    <PreviewSection
      items={items}
      title={Translator.t(config.titleKey)}
      seeAllHref={config.buildSeeAllHref(context)}
      icon={config.icon}
      maxItems={maxItems}
      emptyText={config.emptyTextKey ? Translator.t(config.emptyTextKey) : undefined}
      renderItem={(item) => config.renderItem(
        item, context, config.action === 'navigate' ? config.buildHref(context, item) : undefined,
      )}
    />
  );
}
