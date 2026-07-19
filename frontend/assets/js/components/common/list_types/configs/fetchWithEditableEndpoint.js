import AccessStore from '../../../../utils/access/store/AccessStore.js';

/**
 * Fetch a page from a base path that has both a full, hidden-inclusive `all.json` variant
 * (editors only) and a plain, hidden-filtered variant, resolving the requester's game-level edit
 * permission first to pick between them — the shared strategy behind `characterListTypes.js`'s
 * `fetchNpcs` and `characterTreasureListTypes.js`'s `fetchNpcTreasuresList`.
 *
 * @param {string} gameSlug - Game slug, used to resolve the requester's edit permission.
 * @param {string} base - Base path, without extension (e.g. `/games/{gameSlug}/npcs`).
 * @param {object} filterParams - Filter query params to forward to the fetch.
 * @param {import('../../../../client/GenericClient.js').default} client - HTTP client.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched entries, pagination metadata, and the resolved edit permission.
 */
export default function fetchWithEditableEndpoint(gameSlug, base, filterParams, client) {
  return AccessStore.ensureGamePermissions(gameSlug)
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
