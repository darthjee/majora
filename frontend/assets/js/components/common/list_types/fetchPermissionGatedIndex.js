/**
 * Fetch a page from a base path that has both a full, hidden-inclusive `all.json` variant
 * (editors only) and a plain, hidden-filtered variant, picking between them based on the
 * resolved edit permission — the shared strategy behind every `fetchList` in `listTypeConfig.js`
 * and `configs/` that gates a list endpoint on an edit permission (`fetchTreasures`,
 * `fetchGameItems`, `buildFetchCharacterItems`, `fetchNpcs`, `fetchNpcTreasuresList`). Callers
 * resolve their own permission source (game-level via `AccessStore.ensureGamePermissions`,
 * character-level via `AccessStore.ensureCharacterPermissions`, etc.) and pass the resulting
 * promise in, so this helper stays agnostic of which permission check applies.
 *
 * @param {Promise<{can_edit: boolean}>} permissionsPromise - Resolves to the edit-permission
 *   payload for the requester; rejection is treated as "cannot edit" (fail-closed).
 * @param {string} base - Base path, without extension (e.g. `/games/{gameSlug}/npcs`).
 * @param {object} [filterParams] - Filter query params to forward to the fetch.
 * @param {import('../../../client/GenericClient.js').default} client - HTTP client.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched entries, pagination metadata, and the resolved edit permission.
 */
export default function fetchPermissionGatedIndex(permissionsPromise, base, filterParams, client) {
  return permissionsPromise
    .then((permissions) => Boolean(permissions.can_edit))
    .catch(() => false)
    .then((canEdit) => {
      const path = canEdit ? `${base}/all.json` : `${base}.json`;

      return client.fetchIndex(path, filterParams).then(({ data, pagination }) => ({
        data: Array.isArray(data) ? data : [],
        pagination,
        canEdit,
      }));
    });
}
