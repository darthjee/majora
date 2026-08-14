import GenericClient from '../../../../client/GenericClient.js';
import StlModelFilters from '../../../resources/stl_model/pages/elements/StlModelFilters.jsx';
import StlModelListItem from '../StlModelListItem.js';

/**
 * Group a hash resolver's filter query params by key into a `string | string[]` map — a single
 * value for a key stays scalar (matching every other list type's existing
 * `Object.fromEntries(...)` shape), while 2+ values for the same key (a repeated multi-value
 * filter, e.g. `race`) become an array. Reusing `Object.fromEntries()` directly would silently
 * drop all but the last value for a repeated key, since a later entry simply overwrites an
 * earlier one with the same key. Exported as a plain, named function so it can be exercised
 * directly in specs.
 *
 * @param {URLSearchParams} searchParams - Filter params, as returned by
 *   `HashRouteResolver#getFilterParams`.
 * @returns {object} Query object with each key mapped to a scalar string or a string array.
 */
export function groupFilterParams(searchParams) {
  const grouped = {};

  searchParams.forEach((value, key) => {
    if (grouped[key] === undefined) {
      grouped[key] = value;
    } else if (Array.isArray(grouped[key])) {
      grouped[key] = [...grouped[key], value];
    } else {
      grouped[key] = [grouped[key], value];
    }
  });

  return grouped;
}

/**
 * Fetch a page of the top-level STL models list through `GenericClient` (`GET
 * /miniatures/stl_models.json`), applying the STL model filters bar's `name`/`type`/`size`/
 * `race`/`roles`/`source`/`collection`/`tags` query params from the current hash — mirroring
 * `globalTreasureListType.js`'s own `GenericClient`-based `fetchGlobalTreasures`. Like
 * `gamesListType.js`, this list has no scope and no permission split (every viewer sees the same
 * list).
 *
 * @param {string} gameSlug - Unused for this list type, kept for a uniform `fetchList` signature
 *   across list types.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination/filter params from the current hash.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched STL models and pagination metadata; `canEdit` is always `false`, since this list has
 *   no per-item manage affordance (no write endpoint exists for `stl_models` at all).
 */
function fetchStlModels(gameSlug, hashResolver, client = new GenericClient()) {
  const filterParams = groupFilterParams(hashResolver.getFilterParams());

  return client.fetchIndex('/miniatures/stl_models.json', filterParams).then(({ data, pagination }) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: false,
  }));
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
  filtersComponent: StlModelFilters,
  photoType: 'stl_model',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildEmptyInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 6,
};

export default stlModelListType;
