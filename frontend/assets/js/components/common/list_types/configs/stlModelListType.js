import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import StlModelListItem from '../StlModelListItem.js';

/**
 * Fetch a page of the top-level STL models list through `RequestStore` (`stlModel.collection`).
 * Like `gamesListType.js`, this list has no scope, no permission split (every viewer sees the
 * same list), and no filters.
 *
 * @param {string} gameSlug - Unused for this list type, kept for a uniform `fetchList` signature
 *   across list types.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched STL models and pagination metadata; `canEdit` is always `false`, since this list has
 *   no per-item manage affordance (no write endpoint exists for `stl_models` at all).
 */
function fetchStlModels(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'stlModel',
    params: {},
    query: buildListQuery(hashResolver),
    canEdit: false,
  });
}

/**
 * Build an STL model's action-bar props: always non-manageable, since STL models have no
 * upload/edit affordance on this list page.
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build an STL model's info-bar items: always empty, since STL models have no status/hidden
 * concept on this list page.
 *
 * @returns {Array} Always an empty array.
 */
function buildEmptyInfoBarItems() {
  return [];
}

/**
 * Build an STL model's click-through href, to its detail page.
 *
 * @param {import('../StlModelListItem.js').default} item - Wrapped STL model list item.
 * @returns {string} Hash path to the STL model detail page.
 */
function buildItemHref(item) {
  return `#/miniatures/stl_models/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for the top-level STL models list (`'stlModels'`).
 */
const stlModelListType = {
  fetchList: fetchStlModels,
  wrapperClass: StlModelListItem,
  filtersComponent: null,
  photoType: 'stl_model',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildEmptyInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 6,
};

export default stlModelListType;
