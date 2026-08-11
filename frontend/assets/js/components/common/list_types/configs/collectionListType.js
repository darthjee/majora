import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import CollectionListItem from '../CollectionListItem.js';

/**
 * Fetch a page of the top-level collections list through `RequestStore` (`collection.collection`).
 * Like `sourceListType.js`, this list has no scope, no permission split (every viewer sees the
 * same list), and no filters.
 *
 * @param {string} gameSlug - Unused for this list type, kept for a uniform `fetchList` signature
 *   across list types.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched collections and pagination metadata; `canEdit` is always `false`, since this list has
 *   no per-item manage affordance (the photo upload only happens from the detail page).
 */
function fetchCollections(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'collection',
    params: {},
    query: buildListQuery(hashResolver),
    canEdit: false,
  });
}

/**
 * Build a collection's action-bar props: always non-manageable, since collections have no
 * upload/edit affordance on this list page (the photo upload only happens from the detail page).
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build a collection's info-bar items: always empty, since collections have no status/hidden
 * concept on this list page.
 *
 * @returns {Array} Always an empty array.
 */
function buildEmptyInfoBarItems() {
  return [];
}

/**
 * Build a collection's click-through href, to its detail page.
 *
 * @param {import('../CollectionListItem.js').default} item - Wrapped collection list item.
 * @returns {string} Hash path to the collection detail page.
 */
function buildItemHref(item) {
  return `#/miniatures/collections/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for the top-level collections list (`'collections'`).
 */
const collectionListType = {
  fetchList: fetchCollections,
  wrapperClass: CollectionListItem,
  filtersComponent: null,
  photoType: 'collection',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildEmptyInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 6,
};

export default collectionListType;
