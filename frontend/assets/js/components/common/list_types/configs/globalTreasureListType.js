import GenericClient from '../../../../client/GenericClient.js';
import AccessStore from '../../../../utils/access/store/AccessStore.js';
import TreasureFilters from '../../../resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../../cards/helpers/TreasureCardHelper.jsx';
import TreasureListItem from '../TreasureListItem.js';

/**
 * Fetch a page of the global treasures list, resolving the requester's staff-or-superuser
 * status once (rather than per-item, unlike the game-scoped `treasures` entry, since every
 * viewer of this staff-only page already sees the full list) — the same check
 * `TreasuresController` previously ran before fetching. No `game_slug` scope and no `all.json`
 * variant, matching `GET /treasures.json`.
 *
 * @param {string} gameSlug - Unused for this list type, kept for a uniform `fetchList` signature
 *   across list types.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read active filter query params from the current hash.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched treasures, pagination metadata, and the resolved staff-or-superuser status.
 */
function fetchGlobalTreasures(gameSlug, hashResolver, client = new GenericClient()) {
  return AccessStore.ensureStaffOrSuperUser()
    .then((isStaffOrSuperUser) => Boolean(isStaffOrSuperUser))
    .catch(() => false)
    .then((canEdit) => {
      const filterParams = Object.fromEntries(hashResolver.getFilterParams());

      return client.fetchIndex('/treasures.json', filterParams).then(({ data, pagination }) => ({
        data: Array.isArray(data) ? data : [],
        pagination,
        canEdit,
      }));
    });
}

/**
 * Build a global treasure's action-bar props: the upload-button gate/handler, granted uniformly
 * to every treasure (unlike the game-scoped `treasures` entry, which additionally requires the
 * treasure be exclusive to the current game) since this page is already staff/superuser-only.
 * No secondary "Edit" button, matching `TreasuresHelper.jsx`'s current `TreasureCard` usage
 * (no `editHref`).
 *
 * @param {import('../TreasureListItem.js').default} item - Wrapped treasure list item.
 * @param {{canEdit: boolean, onUploadClick: Function}} context - Rendering context assembled by
 *   `ListPage`.
 * @returns {{canEdit: boolean, onClick: Function, secondaryButtons: object[]}} Action-bar props
 *   for `ActionsOverlay`.
 */
function buildActionBarProps(item, context) {
  return {
    canEdit: Boolean(context.canEdit),
    onClick: () => context.onUploadClick(item.data),
    secondaryButtons: [],
  };
}

/**
 * Build a global treasure's info-bar items (the Hidden badge), delegating to
 * `TreasureCardHelper` so the badge shape isn't duplicated here. In practice the global
 * `/treasures.json` endpoint never includes a `hidden` field, so this never renders a badge
 * today — kept for shape parity with the game-scoped `treasures` entry.
 *
 * @param {import('../TreasureListItem.js').default} item - Wrapped treasure list item.
 * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
 */
function buildInfoBarItems(item) {
  return TreasureCardHelper.buildInfoBarItems(item.data);
}

/**
 * Build a global treasure's click-through href, to its global detail page.
 *
 * @param {import('../TreasureListItem.js').default} item - Wrapped treasure list item.
 * @returns {string} Hash path to the treasure detail page.
 */
function buildItemHref(item) {
  return `#/treasures/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for the global, staff/superuser-only treasures list
 * (`'treasures-global'`), distinct from the game-scoped `treasures` entry (different endpoint,
 * permission source, and action-bar gating), but reusing its `TreasureListItem` wrapper class
 * and `TreasureFilters` filters component, since those shapes match exactly.
 */
const globalTreasureListType = {
  fetchList: fetchGlobalTreasures,
  wrapperClass: TreasureListItem,
  filtersComponent: TreasureFilters,
  photoType: 'treasure',
  buildActionBarProps,
  buildInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 6,
};

export default globalTreasureListType;
