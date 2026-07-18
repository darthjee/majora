import GenericClient from '../../../client/GenericClient.js';
import AccessStore from '../../../utils/access/store/AccessStore.js';
import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/ui/Icons.js';
import TreasureListItem from './TreasureListItem.js';
import GameItemListItem from './GameItemListItem.js';
import CharacterItemListItem from './CharacterItemListItem.js';
import TreasureFilters from '../../resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../cards/helpers/TreasureCardHelper.jsx';
import ItemCardHelper from './ItemCardHelper.jsx';
import gamesListType from './configs/gamesListType.js';
import characterListTypes from './configs/characterListTypes.js';
import characterTreasureListTypes from './configs/characterTreasureListTypes.js';
import globalTreasureListType from './configs/globalTreasureListType.js';
import playersListType from './configs/playersListType.js';

/**
 * Fetch a page of a game's treasures, resolving the requester's edit permission first to
 * pick between the full catalog (`treasures/all.json`, editors only) and the player-facing,
 * hidden-filtered `treasures.json` — the same strategy `GameTreasuresController` previously
 * implemented directly.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read active filter query params from the current hash.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched treasures, pagination metadata, and the resolved edit permission.
 */
function fetchTreasures(gameSlug, hashResolver, client = new GenericClient()) {
  return AccessStore.ensureGamePermissions(gameSlug)
    .then((permissions) => Boolean(permissions.can_edit))
    .catch(() => false)
    .then((canEdit) => {
      const path = canEdit ? `/games/${gameSlug}/treasures/all.json` : `/games/${gameSlug}/treasures.json`;
      const filterParams = Object.fromEntries(hashResolver.getFilterParams());

      return client.fetchIndex(path, filterParams).then(({ data, pagination }) => ({
        data: Array.isArray(data) ? data : [],
        pagination,
        canEdit,
      }));
    });
}

/**
 * Build a treasure's action-bar props: the upload-button gate/handler (manage access limited
 * to treasures exclusive to the current game, matching the prior
 * `canEdit && treasure.game_slug === gameSlug` check) plus, for manageable treasures, a
 * secondary "Edit" overlay button navigating to the game-scoped edit form.
 *
 * @param {import('./TreasureListItem.js').default} item - Wrapped treasure list item.
 * @param {{gameSlug: string, canEdit: boolean, onUploadClick: Function}} context - Rendering
 *   context assembled by `ListPage`.
 * @returns {{canEdit: boolean, onClick: Function, secondaryButtons: object[]}} Action-bar
 *   props for `ActionsOverlay`.
 */
function buildActionBarProps(item, context) {
  const canManage = context.canEdit && item.data.game_slug === context.gameSlug;

  return {
    canEdit: canManage,
    onClick: () => context.onUploadClick(item.data),
    secondaryButtons: canManage ? [{
      label: Translator.t('game_treasures_page.edit'),
      icon: Icons.pencilFill,
      variant: 'outline-secondary',
      onClick: () => {
        window.location.hash = `#/games/${context.gameSlug}/treasures/${item.data.id}/edit`;
      },
    }] : [],
  };
}

/**
 * Build a treasure's info-bar items (the Hidden badge), delegating to
 * `TreasureCardHelper` so the badge shape isn't duplicated here.
 *
 * @param {import('./TreasureListItem.js').default} item - Wrapped treasure list item.
 * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
 */
function buildInfoBarItems(item) {
  return TreasureCardHelper.buildInfoBarItems(item.data);
}

/**
 * Build a treasure's click-through href, to its global detail page.
 *
 * @param {import('./TreasureListItem.js').default} item - Wrapped treasure list item.
 * @returns {string} Hash path to the treasure detail page.
 */
function buildItemHref(item) {
  return `#/treasures/${item.data.id}`;
}

/**
 * Fetch a page of a game's items, resolving the requester's edit permission first to pick
 * between the full catalog (`items/all.json`, dm/admin only) and the player-facing,
 * hidden-filtered `items.json` — mirroring `fetchTreasures`'s game-level permission check.
 * Unlike treasures, items have no filters in scope, so no filter params are read/sent.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../utils/routing/HashRouteResolver.js').default} hashResolver - Unused
 *   for this list type, kept for a uniform `fetchList` signature across list types.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched items, pagination metadata, and the resolved edit permission.
 */
function fetchGameItems(gameSlug, hashResolver, client = new GenericClient()) {
  return AccessStore.ensureGamePermissions(gameSlug)
    .then((permissions) => Boolean(permissions.can_edit))
    .catch(() => false)
    .then((canEdit) => {
      const path = canEdit ? `/games/${gameSlug}/items/all.json` : `/games/${gameSlug}/items.json`;

      return client.fetchIndex(path).then(({ data, pagination }) => ({
        data: Array.isArray(data) ? data : [],
        pagination,
        canEdit,
      }));
    });
}

/**
 * Build a `fetchList` for a character-scoped items list (PC or NPC), resolving the requester's
 * character-level edit permission (`AccessStore.ensureCharacterPermissions` already resolves
 * dm/owner/admin for a PC, dm/admin for an NPC, per `characterKind`) to pick between the full,
 * hidden-inclusive `items/all.json` and the player-facing `items.json`. The character id is read
 * from the current hash rather than passed explicitly, since `ListPageController` only threads a
 * `gameSlug` through to `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver, client?)` function for this kind.
 */
function buildFetchCharacterItems(characterKind) {
  return function fetchCharacterItems(gameSlug, hashResolver, client = new GenericClient()) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/items`,
    );

    return AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => {
        const base = `/games/${gameSlug}/${characterKind}/${characterId}/items`;
        const path = canEdit ? `${base}/all.json` : `${base}.json`;

        return client.fetchIndex(path).then(({ data, pagination }) => ({
          data: Array.isArray(data) ? data : [],
          pagination,
          canEdit,
        }));
      });
  };
}

/**
 * Build an item's action-bar props: always non-manageable, since items have no upload/edit
 * affordance in scope (read-only feature, issue #658).
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build a `buildInfoBarItems(item)` function for an item list type (the Hidden badge),
 * delegating to `ItemCardHelper` so the badge shape isn't duplicated per list type.
 *
 * @param {string} hiddenLabelKey - i18n key for the Hidden badge's tooltip label, distinct per
 *   list type (`game_items_page.hidden_label` / `character_items_page.hidden_label`).
 * @returns {Function} A `buildInfoBarItems(item)` function for this list type.
 */
function buildItemInfoBarItems(hiddenLabelKey) {
  return function buildInfoBarItemsForItem(item) {
    return ItemCardHelper.buildInfoBarItems(item.data, Translator.t(hiddenLabelKey));
  };
}

/**
 * Build an item's click-through href: always `null`, since items have no standalone detail
 * page in scope (issue #658) — `ListPageHelper` renders the caption as plain text in that case.
 *
 * @returns {null} Always null.
 */
function buildNullItemHref() {
  return null;
}

/**
 * Per-list-type configuration consumed by `ListPage`/`ListPageHelper`, keyed by list type
 * (`'treasures'`, `'items'`, `'pc-items'`, `'npc-items'`, `'games'`, `'players'`, `'pcs'`,
 * `'npcs'`, `'pc-treasures'`, `'npc-treasures'`, `'treasures-global'`), matching the existing
 * `PHOTO_COMPONENTS` precedent in `ActionsOverlay.jsx`. The `games`/`players`/`pcs`/`npcs`/
 * `pc-treasures`/`npc-treasures`/`treasures-global` entries live in `./configs/`, split out of
 * this file to keep it under the project's max-lines limit; they are merged into this object
 * below. Each entry holds:
 * - `fetchList(gameSlug, hashResolver, client?)` — fetches one page of list data.
 * - `wrapperClass` — the `BaseListItem` subclass normalizing each raw entry.
 * - `filtersComponent` — filter bar rendered above the grid, or `null`.
 * - `photoType` — `ActionsOverlay`'s `type` prop for this entity's photo/avatar.
 * - `buildActionBarProps(item, context)` / `buildInfoBarItems(item, context)` — delegate to
 *   the existing per-card helpers rather than re-implementing them.
 * - `buildCardClassName(item)` — optional; extra class(es) appended to the outer card div
 *   (e.g. the NPC allegiance border). Defaults to no-op when omitted.
 * - `showCaption` — whether caption text (display text + optional formatted value + optional
 *   availability text) appears under the photo.
 * - `buildItemHref(item, context)` — click-through URL builder; `null` when the type has no
 *   detail page to link to (e.g. items).
 * - `itemsPerRow` — number of cards per row at the largest (`lg`) breakpoint, read by
 *   `ListPageHelper` to pick the outer card column class (`6` → `col-lg-2`, `4` → `col-lg-3`);
 *   defaults to `6` when omitted.
 */
const listTypeConfig = {
  treasures: {
    fetchList: fetchTreasures,
    wrapperClass: TreasureListItem,
    filtersComponent: TreasureFilters,
    photoType: 'treasure',
    buildActionBarProps,
    buildInfoBarItems,
    showCaption: true,
    buildItemHref,
    itemsPerRow: 6,
  },
  items: {
    fetchList: fetchGameItems,
    wrapperClass: GameItemListItem,
    filtersComponent: null,
    photoType: 'item',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('game_items_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildNullItemHref,
    itemsPerRow: 6,
  },
  'pc-items': {
    fetchList: buildFetchCharacterItems('pcs'),
    wrapperClass: CharacterItemListItem,
    filtersComponent: null,
    photoType: 'item',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_items_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildNullItemHref,
    itemsPerRow: 6,
  },
  'npc-items': {
    fetchList: buildFetchCharacterItems('npcs'),
    wrapperClass: CharacterItemListItem,
    filtersComponent: null,
    photoType: 'item',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_items_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildNullItemHref,
    itemsPerRow: 6,
  },
  games: gamesListType,
  players: playersListType,
  ...characterListTypes,
  ...characterTreasureListTypes,
  'treasures-global': globalTreasureListType,
};

export default listTypeConfig;
