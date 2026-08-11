/**
 * Resource configuration for `collection` — mirrors `GET /miniatures/collections.json` (list),
 * `GET /miniatures/collections/:id.json` (detail), `POST /miniatures/collections.json` (create),
 * and `POST /miniatures/collections/:id/photo_upload.json` (photo upload init), per
 * `docs/agents/issues/1057-add-miniatures-collection.md`.
 *
 * @description Mirrors `sourceConfig.js`'s shape exactly: both `GET` endpoints are
 *   `IsAuthenticated` with no separate restricted/full variant (no `can_edit`/staff/superuser
 *   concept is embedded in the payload for `collections`), so `private` points at the exact same
 *   `path`/`permission` object as `regular` for both `collection` and `single`.
 *   `resolveVariant.js` always reads `config.private.permission`, so `private` must be present
 *   even though it's never actually selected (`permission: null` never grants).
 *
 *   `POST.collection` (create, `/miniatures/collections.json`) and `POST.single` (photo-upload
 *   init, `/miniatures/collections/:id/photo_upload.json`) are both staff/superuser-gated
 *   server-side (`require_staff`), with no restricted/full variant either — `regular`/`private`
 *   point at the exact same object for both. The page-level `AccessStore.ensureStaffOrSuperUser()`
 *   redirect gates already do the real, page-level gating; this config only resolves the URL, so
 *   `permission: null` here is documentation-only.
 */
const collection = { path: () => '/miniatures/collections.json', permission: null };
const single = { path: ({ id }) => `/miniatures/collections/${id}.json`, permission: null };
const create = { path: () => '/miniatures/collections.json', permission: null };
const photoUploadInit = { path: ({ id }) => `/miniatures/collections/${id}/photo_upload.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
  },
  POST: {
    collection: { regular: create, private: create },
    single: { regular: photoUploadInit, private: photoUploadInit },
  },
};
