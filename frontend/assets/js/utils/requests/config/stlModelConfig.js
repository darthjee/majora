/**
 * GET-only resource configuration for `stlModel` — mirrors `GET /miniatures/stl_models.json`
 * (list) and `GET /miniatures/stl_models/:id.json` (detail), per
 * `docs/agents/access-control/stl-model.md`.
 *
 * @description Both endpoints are `IsAuthenticated` with no separate restricted/full variant
 *   (no `can_edit`/staff/superuser concept exists for `stl_models` at all — none of the five
 *   `miniatures` models expose any write endpoint), so `private` points at the exact same
 *   `path`/`permission` object as `regular` for both `collection` and `single`, mirroring
 *   `gameConfig.js`'s own un-branched `GET` shape. `resolveVariant.js` always reads
 *   `config.private.permission`, so `private` must be present even though it's never actually
 *   selected (`permission: null` never grants).
 */
const collection = { path: () => '/miniatures/stl_models.json', permission: null };
const single = { path: ({ id }) => `/miniatures/stl_models/${id}.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
  },
};
