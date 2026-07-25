import React from 'react';
import ShortList from './ShortList.jsx';

/**
 * Factory building a `ShowPageLayout` slot entry bound to one shortlist resource type, matching
 * the closure pattern `pcShowType.js`/`npcShowType.js` already use for their
 * `buildCharacterNameField(...)`-style field factories. Declaring
 * `buildShortListSlot('pc')`/`buildShortListSlot('treasure', { maxItems: 3 })` etc. in a show
 * type's `right` slot array is what drives which shortlists appear on a page, in what order,
 * and with what per-list item count — configuration, not code.
 *
 * @param {string} resource - Resource type key into `shortListResourceConfig`
 *   (`'pc'`, `'npc'`, `'treasure'`, `'item'`, `'document'`).
 * @param {object} [options] - Options.
 * @param {number} [options.maxItems] - Maximum number of items shown before the "See all" card,
 *   forwarded to `ShortList`. Defaults to `ShortList`'s own default (`MAX_PREVIEW_ITEMS`).
 * @returns {Function} A component receiving the page's merged rendering context, rendering a
 *   `ShortList` for this resource.
 */
export default function buildShortListSlot(resource, { maxItems } = {}) {
  return function ShortListSlot(context) {
    return React.createElement(ShortList, { resource, maxItems, ...context });
  };
}
