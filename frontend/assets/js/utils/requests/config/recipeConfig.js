/**
 * `GET`/mutation resource configuration for `recipe` (issue #1449), backing `GameRecipe` —
 * modeled on `commonItemConfig.js`: unconditionally game-level, no `kind` branching and no
 * character-owned family (character recipes live in `characterRecipeConfig.js`, issue #1450).
 *
 * @description `collection`/`single` params: `gameSlug` and, for `single`, `id` (the
 *   `GameRecipe`'s own id). `commonItemCollection` params: `gameSlug` and `commonItemId` — the
 *   "Recipes that produce it" listing under a `GameCommonItem`. `characters` params: `gameSlug`
 *   and `id` (the `GameRecipe`'s own id) — the "Known by" listing (issue #1450), whose entries
 *   are PCs and NPCs (`type: 'pc'|'npc'`). Every `private` variant (`recipes/all.json`,
 *   `recipes/:id/full.json`, `common_items/:commonItemId/recipes/all.json`,
 *   `recipes/:id/characters/all.json`)
 *   is gated by game-level `can_edit` (`GameEditPermission`), resolved via
 *   `AccessStore.ensureGamePermissions(gameSlug)` — see `RequestPermissionResolvers.js` — and
 *   carries `skipCache: true` so an editor always sees fresh (including hidden) data.
 *
 *   `POST.collection` (create) and `PATCH.single` (update) are unbranched — `regular`/`private`
 *   point at the exact same object, mirroring `commonItemConfig.js`.
 */

/**
 * Build the player-facing single-`GameRecipe` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameRecipe` id.
 * @returns {string} The endpoint path.
 */
const singlePath = ({ gameSlug, id }) => `/games/${gameSlug}/recipes/${id}.json`;

/**
 * Build the full (editor-only) single-`GameRecipe` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameRecipe` id.
 * @returns {string} The endpoint path.
 */
const singleFullPath = ({ gameSlug, id }) => `/games/${gameSlug}/recipes/${id}/full.json`;

/**
 * Build the player-facing recipes collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const collectionPath = ({ gameSlug }) => `/games/${gameSlug}/recipes.json`;

/**
 * Build the full (editor-only) recipes collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const collectionFullPath = ({ gameSlug }) => `/games/${gameSlug}/recipes/all.json`;

/**
 * Build the player-facing path listing the recipes that produce a common item.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.commonItemId - `GameCommonItem` id.
 * @returns {string} The endpoint path.
 */
const commonItemCollectionPath = ({ gameSlug, commonItemId }) => (
  `/games/${gameSlug}/common_items/${commonItemId}/recipes.json`
);

/**
 * Build the full (editor-only) path listing the recipes that produce a common item.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.commonItemId - `GameCommonItem` id.
 * @returns {string} The endpoint path.
 */
const commonItemCollectionFullPath = ({ gameSlug, commonItemId }) => (
  `/games/${gameSlug}/common_items/${commonItemId}/recipes/all.json`
);

/**
 * Build the player-facing "Known by" (characters knowing a recipe) path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameRecipe` id.
 * @returns {string} The endpoint path.
 */
const charactersPath = ({ gameSlug, id }) => `/games/${gameSlug}/recipes/${id}/characters.json`;

/**
 * Build the full (editor-only) "Known by" path, adding hidden entries.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameRecipe` id.
 * @returns {string} The endpoint path.
 */
const charactersFullPath = ({ gameSlug, id }) => `/games/${gameSlug}/recipes/${id}/characters/all.json`;

const patchSingle = { path: singlePath, permission: 'can_edit' };
const createCollection = { path: collectionPath, permission: 'can_edit' };

export default {
  GET: {
    collection: {
      regular: { path: collectionPath, permission: null },
      private: { path: collectionFullPath, permission: 'can_edit', skipCache: true },
    },
    single: {
      regular: { path: singlePath, permission: null },
      private: { path: singleFullPath, permission: 'can_edit', skipCache: true },
    },
    commonItemCollection: {
      regular: { path: commonItemCollectionPath, permission: null },
      private: { path: commonItemCollectionFullPath, permission: 'can_edit', skipCache: true },
    },
    characters: {
      regular: { path: charactersPath, permission: null },
      private: { path: charactersFullPath, permission: 'can_edit', skipCache: true },
    },
  },
  PATCH: {
    single: { regular: patchSingle, private: patchSingle },
  },
  POST: {
    collection: { regular: createCollection, private: createCollection },
  },
};
