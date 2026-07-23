import RequestStore from '../../../utils/requests/RequestStore.js';

/**
 * Fetch a page of a `RequestStore`-backed collection resource, wrapping the result to the
 * `{data, pagination, canEdit}` shape `ListPageController` expects — the `RequestStore`
 * equivalent of `fetchPermissionGatedIndex.js`, used by every list type migrated onto
 * `RequestStore.ensure()` (issue #791, phase 3/N).
 *
 * @description `RequestStore.ensure()` already resolves the regular/private endpoint variant
 *   internally (via `RequestPermissionResolvers`), but does not expose *which* variant it picked
 *   — so `canEdit`, needed by `ListPage` to gate per-item manage affordances, is resolved
 *   independently here from the same permissions source, deduped against `RequestStore`'s own
 *   permission resolution by `AccessStore`'s own cache (the same precedent
 *   `CharacterItemDetailController`'s `can_upload_item_photo` read already established in Step
 *   2 of this issue's plan).
 * @param {object} args - Arguments.
 * @param {string} args.componentName - Name of the component/controller triggering the request,
 *   forwarded to `RequestStore.ensure()` (see {@link RequestStoreLogging}) — every list type
 *   fetched through this helper is driven by the shared `ListPageController`, so callers pass
 *   `'ListPageController'`; `resource` (already threaded through) is what actually distinguishes
 *   one list type from another in the log.
 * @param {string} args.resource - Resource name, a `resourceConfig`/`RequestStore` key.
 * @param {object} args.params - Concrete params (`gameSlug`, `kind`, `id`, etc.).
 * @param {object} [args.query] - Query/filters (pagination, active filters).
 * @param {Promise<{can_edit?: boolean}>|boolean} [args.canEdit] - Either a permissions promise
 *   (resolved fail-closed to its `can_edit` field, mirroring
 *   `fetchPermissionGatedIndex.js`'s own fail-closed handling) or a plain boolean for list types
 *   with no restricted variant at all (`canEdit` is then always that fixed value).
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched entries, pagination metadata, and the resolved edit permission.
 */
export default function fetchRequestStoreList({
  componentName, resource, params, query = {}, canEdit = false,
}) {
  const canEditPromise = typeof canEdit === 'boolean'
    ? Promise.resolve(canEdit)
    : canEdit.then((permissions) => Boolean(permissions.can_edit)).catch(() => false);

  return Promise.all([
    RequestStore.ensure({
      componentName, resource, quantityType: 'collection', params, query,
    }),
    canEditPromise,
  ]).then(([{ data, pagination }, resolvedCanEdit]) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: resolvedCanEdit,
  }));
}

/**
 * Build a `RequestStore` query object from a hash resolver's pagination params plus optional
 * extra filter params — the `RequestStore` equivalent of `GenericClient#fetchIndex`'s implicit
 * pagination handling, now made explicit since `RequestStore.ensure()` never reads the current
 * hash itself.
 *
 * @param {import('../../../utils/routing/HashRouteResolver.js').default} hashResolver - Resolver
 *   used to read pagination (and, when given, filter) params from the current hash.
 * @param {object} [extraParams] - Additional query params to merge in (e.g. active filters).
 * @returns {object} Query object combining pagination and extra params.
 */
export function buildListQuery(hashResolver, extraParams = {}) {
  return { ...Object.fromEntries(hashResolver.getPaginationParams()), ...extraParams };
}
