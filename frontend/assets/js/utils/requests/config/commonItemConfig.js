/**
 * `GET`/mutation resource configuration for `commonItem` (issue #826), backing `GameCommonItem`
 * — much simpler than `possessionConfig.js`/`itemConfig.js` since `GameCommonItem` has no
 * character-owned family at all: no `kind` branching, no `availableCollection`/`acquire`/
 * `remove`, unconditionally game-level.
 *
 * @description `collection`/`single` params: `gameSlug` and, for `single`, `id` (the
 *   `GameCommonItem`'s own id). `private` variants (`common_items/all.json`,
 *   `common_items/:id/full.json`) are gated by game-level `can_edit` (`GameEditPermission`),
 *   resolved via `AccessStore.ensureGamePermissions(gameSlug)` — see
 *   `RequestPermissionResolvers.js`.
 *
 *   `PATCH.single` (update) reuses `single`'s own `regular` path, unbranched — no separate
 *   `/full.json` counterpart exists for `PATCH`, so `regular`/`private` point at the exact same
 *   object, mirroring `possessionConfig.js`'s own `PATCH.single`.
 *
 *   `POST.collection` (create) reuses `collection`'s own `regular` path, unbranched — no
 *   restricted/full variant exists for creation itself, so `regular`/`private` point at the exact
 *   same object.
 *
 *   `POST.single` (photo-upload init, `.../common_items/:id/photo_upload.json`) is unbranched —
 *   `regular`/`private` point at the exact same object; the actual permission (staff and any
 *   player of the game) is enforced server-side, mirroring `possessionConfig.js`'s own
 *   `POST.single`. Params: `gameSlug`, `id`.
 */

/**
 * Build the player-facing single-`GameCommonItem` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameCommonItem` id.
 * @returns {string} The endpoint path.
 */
const singlePath = ({ gameSlug, id }) => `/games/${gameSlug}/common_items/${id}.json`;

/**
 * Build the full (editor-only) single-`GameCommonItem` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameCommonItem` id.
 * @returns {string} The endpoint path.
 */
const singleFullPath = ({ gameSlug, id }) => `/games/${gameSlug}/common_items/${id}/full.json`;

/**
 * Build the player-facing common items collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const collectionPath = ({ gameSlug }) => `/games/${gameSlug}/common_items.json`;

/**
 * Build the full (editor-only) common items collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const collectionFullPath = ({ gameSlug }) => `/games/${gameSlug}/common_items/all.json`;

const patchSingle = { path: singlePath, permission: 'can_edit' };
const createCollection = { path: collectionPath, permission: 'can_edit' };
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/common_items/${id}/photo_upload.json`,
  permission: null,
};

export default {
  GET: {
    collection: {
      regular: { path: collectionPath, permission: null },
      private: { path: collectionFullPath, permission: 'can_edit' },
    },
    single: {
      regular: { path: singlePath, permission: null },
      private: { path: singleFullPath, permission: 'can_edit' },
    },
  },
  PATCH: {
    single: { regular: patchSingle, private: patchSingle },
  },
  POST: {
    collection: { regular: createCollection, private: createCollection },
    single: { regular: photoUploadInit, private: photoUploadInit },
  },
};
