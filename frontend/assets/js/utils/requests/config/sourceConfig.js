/**
 * Resource configuration for `source` — mirrors `GET /miniatures/sources.json` (list),
 * `GET /miniatures/sources/:id.json` (detail), `POST /miniatures/sources.json` (create),
 * and `POST /miniatures/sources/:id/photo_upload.json` (photo upload init), per
 * `docs/agents/issues/1053-add-miniatures-source.md`.
 *
 * @description Both `GET` endpoints are `IsAuthenticated` with no separate restricted/full
 *   variant (no `can_edit`/staff/superuser concept is embedded in the payload for `sources`),
 *   so `private` points at the exact same `path`/`permission` object as `regular` for both
 *   `collection` and `single`, mirroring `stlModelConfig.js`'s own un-branched `GET` shape.
 *   `resolveVariant.js` always reads `config.private.permission`, so `private` must be present
 *   even though it's never actually selected (`permission: null` never grants).
 *
 *   `POST.collection` (create, `/miniatures/sources.json`) and `POST.single` (photo-upload
 *   init, `/miniatures/sources/:id/photo_upload.json`) are both staff/superuser-gated
 *   server-side (`require_staff`), with no restricted/full variant either — `regular`/`private`
 *   point at the exact same object for both, mirroring `stlModelConfig.js`'s standalone
 *   create/photo-upload shape. The page-level `AccessStore.ensureStaffOrSuperUser()` redirect
 *   gates already do the real, page-level gating; this config only resolves the URL, so
 *   `permission: null` here is documentation-only.
 */
const collection = { path: () => '/miniatures/sources.json', permission: null };
const single = { path: ({ id }) => `/miniatures/sources/${id}.json`, permission: null };
const create = { path: () => '/miniatures/sources.json', permission: null };
const photoUploadInit = { path: ({ id }) => `/miniatures/sources/${id}/photo_upload.json`, permission: null };

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
