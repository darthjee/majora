import React from 'react';
import CharacterPreviewCard from './CharacterPreviewCard.jsx';
import TreasurePreviewCard from './TreasurePreviewCard.jsx';
import ItemPreviewCard from './ItemPreviewCard.jsx';
import DocumentPreviewCard from './DocumentPreviewCard.jsx';
import { PREVIEW_LIST_TYPES } from './characterPreviewConstants.js';

/**
 * Character URL segment (`'pcs'`/`'npcs'`) for a show-page context, used to build fetch params
 * and hrefs for the character-owned resources (treasures, items, documents).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {boolean} [context.is_pc] - Whether the character is a PC.
 * @returns {string} `'pcs'` or `'npcs'`.
 */
function characterSegment(context) {
  return context.is_pc ? 'pcs' : 'npcs';
}

/**
 * `buildParams` shared by the character-owned resources (treasure, item, document): the
 * `RequestStore.ensure` params for the character's own collection endpoint.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.game_slug - Game slug.
 * @param {number|string} context.id - Character id.
 * @returns {{gameSlug: string, kind: string, id: (number|string)}} Request params.
 */
function characterResourceParams(context) {
  return { gameSlug: context.game_slug, kind: characterSegment(context), id: context.id };
}

/**
 * `buildSeeAllHref` shared by the character-owned resources (treasure, item, document).
 *
 * @param {string} resource - Resource name (`'treasure'`, `'item'`, `'document'`).
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @returns {string} Hash href for the resource's full list page.
 */
function characterResourceSeeAllHref(resource, context) {
  return `#/games/${context.game_slug}/${characterSegment(context)}/${context.id}/${resource}s`;
}

/**
 * Build a `CharacterPreviewCard` for a `'pc'`/`'npc'` shortlist item.
 *
 * @param {string} characterType - `'pc'` or `'npc'`.
 * @param {object} item - Character preview data object.
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @returns {React.ReactElement} `CharacterPreviewCard` element.
 */
function renderCharacterPreviewCard(characterType, item, context) {
  return React.createElement(CharacterPreviewCard, {
    key: item.id, character: item, gameSlug: context.game_slug, characterType,
  });
}

/**
 * Per-resource-type behavior registry driving `ShortList`: how to fetch a resource's preview
 * list (`buildParams`), where its "See all" card links (`buildSeeAllHref`), whether/where a
 * clicked card navigates (`action`/`buildHref`), and how to render a single item's card
 * (`renderItem(item, context, href)`).
 *
 * @description `document` (issue #892) now flips to `action: 'navigate'`, mirroring the `item`
 *   entry immediately above it — a `CharacterDocument` show page (`character_document`
 *   `showTypeConfig` entry) now exists to link to, distinct from the unrelated `document` show
 *   type backing the game-level `GameDocument` show/new/edit page.
 *   `'show picture'` is a valid `action` value by shape, matching the issue's spec, but is not
 *   assigned to any resource here.
 * @type {object}
 */
const shortListResourceConfig = {
  pc: {
    titleKey: PREVIEW_LIST_TYPES.pc.titleKey,
    icon: PREVIEW_LIST_TYPES.pc.icon,
    action: 'navigate',
    buildParams: (context) => ({ gameSlug: context.game_slug }),
    buildSeeAllHref: (context) => `#/games/${context.game_slug}/pcs`,
    buildHref: (context, item) => `#/games/${context.game_slug}/pcs/${item.id}`,
    renderItem: (item, context) => renderCharacterPreviewCard('pc', item, context),
  },
  npc: {
    titleKey: PREVIEW_LIST_TYPES.npc.titleKey,
    icon: PREVIEW_LIST_TYPES.npc.icon,
    action: 'navigate',
    buildParams: (context) => ({ gameSlug: context.game_slug }),
    buildSeeAllHref: (context) => `#/games/${context.game_slug}/npcs`,
    buildHref: (context, item) => `#/games/${context.game_slug}/npcs/${item.id}`,
    renderItem: (item, context) => renderCharacterPreviewCard('npc', item, context),
  },
  treasure: {
    titleKey: PREVIEW_LIST_TYPES.treasure.titleKey,
    icon: PREVIEW_LIST_TYPES.treasure.icon,
    emptyTextKey: 'character_treasures_preview.empty',
    action: 'navigate',
    buildParams: characterResourceParams,
    buildSeeAllHref: (context) => characterResourceSeeAllHref('treasure', context),
    buildHref: (context, item) => `#/treasures/${item.treasure_id}`,
    renderItem: (item, context) => React.createElement(TreasurePreviewCard, {
      key: item.id,
      treasure: {
        id: item.treasure_id,
        name: item.name,
        value: item.value,
        photo_path: item.photo_path,
        game_type: context.game_type,
      },
      quantity: item.quantity,
    }),
  },
  item: {
    titleKey: PREVIEW_LIST_TYPES.item.titleKey,
    icon: PREVIEW_LIST_TYPES.item.icon,
    emptyTextKey: 'character_items_preview.empty',
    action: 'navigate',
    buildParams: characterResourceParams,
    buildSeeAllHref: (context) => characterResourceSeeAllHref('item', context),
    buildHref: (context, item) => (
      `#/games/${context.game_slug}/${characterSegment(context)}/${context.id}/items/${item.id}`
    ),
    renderItem: (item, context, href) => React.createElement(
      ItemPreviewCard, { key: item.id, item, href },
    ),
  },
  document: {
    titleKey: PREVIEW_LIST_TYPES.document.titleKey,
    icon: PREVIEW_LIST_TYPES.document.icon,
    emptyTextKey: 'character_documents_preview.empty',
    action: 'navigate',
    buildParams: characterResourceParams,
    buildSeeAllHref: (context) => characterResourceSeeAllHref('document', context),
    buildHref: (context, item) => (
      `#/games/${context.game_slug}/${characterSegment(context)}/${context.id}/documents/${item.id}`
    ),
    renderItem: (item, context, href) => React.createElement(
      DocumentPreviewCard, { key: item.id, document: item, href },
    ),
  },
};

export default shortListResourceConfig;
