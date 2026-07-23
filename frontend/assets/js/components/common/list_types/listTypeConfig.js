import AccessStore from '../../../utils/access/store/AccessStore.js';
import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/ui/Icons.js';
import TreasureListItem from './TreasureListItem.js';
import GameItemListItem from './GameItemListItem.js';
import CharacterItemListItem from './CharacterItemListItem.js';
import TreasureFilters from '../../resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../cards/helpers/TreasureCardHelper.jsx';
import ItemCardHelper from './ItemCardHelper.jsx';
import fetchRequestStoreList, { buildListQuery } from './fetchRequestStoreList.js';
import gamesListType from './configs/gamesListType.js';
import myGamesListType from './configs/myGamesListType.js';
import characterListTypes from './configs/characterListTypes.js';
import characterTreasureListTypes from './configs/characterTreasureListTypes.js';
import globalTreasureListType from './configs/globalTreasureListType.js';
import playersListType from './configs/playersListType.js';
import documentListTypes from './configs/documentListTypes.js';

/**
 * Fetch a page of a game's treasures through `RequestStore` (`treasure.collection`, `kind:
 * 'game'`), resolving the requester's edit permission first to pick between the full catalog
 * (`treasures/all.json`, editors only) and the player-facing, hidden-filtered `treasures.json`
 * — the same strategy `GameTreasuresController` previously implemented directly.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination and active filter query params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched treasures, pagination metadata, and the resolved edit permission.
 */
function fetchTreasures(gameSlug, hashResolver) {
  const filterParams = Object.fromEntries(hashResolver.getFilterParams());

  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'treasure',
    params: { gameSlug, kind: 'game' },
    query: buildListQuery(hashResolver, filterParams),
    canEdit: AccessStore.ensureGamePermissions(gameSlug),
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
 * Fetch a page of a game's items through `RequestStore` (`item.collection`, `kind: 'game'`),
 * resolving the requester's edit permission first to pick between the full catalog
 * (`items/all.json`, dm/admin only) and the player-facing, hidden-filtered `items.json` —
 * mirroring `fetchTreasures`'s game-level permission check. Unlike treasures, items have no
 * filters in scope, so no filter params are read/sent.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched items, pagination metadata, and the resolved edit permission.
 */
function fetchGameItems(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'item',
    params: { gameSlug, kind: 'game' },
    query: buildListQuery(hashResolver),
    canEdit: AccessStore.ensureGamePermissions(gameSlug),
  });
}

/**
 * Build a `fetchList` for a character-scoped items list (PC or NPC) through `RequestStore`
 * (`item.collection`, `kind: 'pcs'|'npcs'`), resolving the requester's character-level edit
 * permission (`AccessStore.ensureCharacterPermissions` already resolves dm/owner/admin for a
 * PC, dm/admin for an NPC, per `characterKind`) to pick between the full, hidden-inclusive
 * `items/all.json` and the player-facing `items.json`. The character id is read from the
 * current hash rather than passed explicitly, since `ListPageController` only threads a
 * `gameSlug` through to `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver)` function for this kind.
 */
function buildFetchCharacterItems(characterKind) {
  return function fetchCharacterItems(gameSlug, hashResolver) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/items`,
    );

    return fetchRequestStoreList({
      componentName: 'ListPageController',
      resource: 'item',
      params: { gameSlug, kind: characterKind, id: characterId },
      query: buildListQuery(hashResolver),
      canEdit: AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId),
    });
  };
}

/**
 * Build a read-only action-bar props object: always non-manageable, no secondary buttons.
 * Shared by every list type with no per-item upload/edit affordance in scope (items, PCs,
 * character-owned treasures).
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
export function buildReadOnlyActionBarProps() {
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
export function buildItemInfoBarItems(hiddenLabelKey) {
  return function buildInfoBarItemsForItem(item) {
    return ItemCardHelper.buildInfoBarItems(item.data, Translator.t(hiddenLabelKey));
  };
}

/**
 * Build a game item's click-through href, to its game-scoped detail page (issue #724).
 *
 * @param {import('./GameItemListItem.js').default} item - Wrapped game item list item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the item's detail page.
 */
function buildGameItemHref(item, context) {
  return `#/games/${context.gameSlug}/items/${item.data.id}`;
}

/**
 * Build a `buildItemHref(item, context)` function for a character-scoped items list (PC or
 * NPC), linking to the item's own detail page (issue #724). Distinct from
 * `characterListTypes.js`'s `buildCharacterItemHref`, which links to a *character's* page, not
 * an *item's*. Needs `context.characterId`, threaded in by `CharacterItemsHelper` since
 * `ListPage`'s default context only merges in `gameSlug`/`canEdit` automatically.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `buildItemHref(item, context)` function for this character kind.
 */
function buildCharacterItemItemHref(characterKind) {
  return function buildHref(item, context) {
    return `#/games/${context.gameSlug}/${characterKind}/${context.characterId}/items/${item.data.id}`;
  };
}

/**
 * Per-list-type configuration consumed by `ListPage`/`ListPageHelper`, keyed by list type
 * (`'treasures'`, `'items'`, `'pc-items'`, `'npc-items'`, `'documents'`, `'pc-documents'`,
 * `'npc-documents'`, `'games'`, `'my-games'`, `'players'`, `'pcs'`, `'npcs'`, `'pc-treasures'`,
 * `'npc-treasures'`, `'treasures-global'`), matching the
 * existing `PHOTO_COMPONENTS` precedent in `ActionsOverlay.jsx`. The `games`/`my-games`/
 * `players`/`pcs`/`npcs`/`pc-treasures`/`npc-treasures`/`treasures-global`/`documents`/
 * `pc-documents`/`npc-documents` entries live in `./configs/`, split out of this file to keep it
 * under the project's max-lines limit; they are merged into this object below. Each entry holds:
 * - `fetchList(gameSlug, hashResolver, client?)` — fetches one page of list data. Every type
 *   migrated onto `RequestStore` (issue #791, phase 3/N) ignores the `client` argument (kept
 *   only where a later positional argument, e.g. `gameClient`, still needs it); the handful of
 *   list types intentionally left on `fetchPermissionGatedIndex` (`documents`, `treasures-global`,
 *   `my-games`, `players`) still use it.
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
 *   detail page to link to.
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
    buildItemHref: buildGameItemHref,
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
    buildItemHref: buildCharacterItemItemHref('pcs'),
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
    buildItemHref: buildCharacterItemItemHref('npcs'),
    itemsPerRow: 6,
  },
  games: gamesListType,
  'my-games': myGamesListType,
  players: playersListType,
  ...characterListTypes,
  ...characterTreasureListTypes,
  'treasures-global': globalTreasureListType,
  ...documentListTypes,
};

export default listTypeConfig;
