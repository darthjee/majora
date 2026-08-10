import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import SourceListItem from '../SourceListItem.js';

/**
 * Fetch a page of the top-level sources list through `RequestStore` (`source.collection`).
 * Like `stlModelListType.js`, this list has no scope, no permission split (every viewer sees
 * the same list), and no filters.
 *
 * @param {string} gameSlug - Unused for this list type, kept for a uniform `fetchList` signature
 *   across list types.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched sources and pagination metadata; `canEdit` is always `false`, since this list has
 *   no per-item manage affordance (the photo upload only happens from the detail page).
 */
function fetchSources(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'source',
    params: {},
    query: buildListQuery(hashResolver),
    canEdit: false,
  });
}

/**
 * Build a source's action-bar props: always non-manageable, since sources have no upload/edit
 * affordance on this list page (the photo upload only happens from the detail page).
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build a source's info-bar items: always empty, since sources have no status/hidden concept on
 * this list page.
 *
 * @returns {Array} Always an empty array.
 */
function buildEmptyInfoBarItems() {
  return [];
}

/**
 * Build a source's click-through href, to its detail page.
 *
 * @param {import('../SourceListItem.js').default} item - Wrapped source list item.
 * @returns {string} Hash path to the source detail page.
 */
function buildItemHref(item) {
  return `#/miniatures/sources/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for the top-level sources list (`'sources'`).
 */
const sourceListType = {
  fetchList: fetchSources,
  wrapperClass: SourceListItem,
  filtersComponent: null,
  photoType: 'source',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildEmptyInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 6,
};

export default sourceListType;
