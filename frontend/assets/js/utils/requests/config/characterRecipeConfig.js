/**
 * GET/mutation resource configuration for `characterRecipe` (issue #1450), backing a PC's or
 * NPC's known `CharacterRecipe`s — modeled on the character-owned half of `documentConfig.js`.
 *
 * @description Params: `gameSlug`, `kind` (`'pcs'` or `'npcs'`), `id` (character id) and, for
 *   `single`, `characterRecipeId` (the `CharacterRecipe` row id).
 *
 *   `collection`/`single` `private` variants (`recipes/all.json`,
 *   `recipes/:characterRecipeId/full.json`) are gated by character-level `can_edit`
 *   (`AccessStore.ensureCharacterPermissions`), while `availableCollection`'s `private` variant
 *   (`recipes/available/all.json`) is gated by game-level `can_edit` (`GameEditPermission`), so an
 *   owning player never sees the hidden catalog — see `RequestPermissionResolvers.js`. Every
 *   `private` read (and the regular available catalog) carries `skipCache: true`.
 *
 *   `POST.acquire`/`POST.remove` (body `{game_recipe_id}`) back the exchange modal's tabs;
 *   callers pass `variantName` explicitly, so their `permission` is documentation-only.
 *   `PATCH.single` (body `{hidden}`) backs the detail page's hidden toggle and is unbranched.
 */

/**
 * Build the base `/games/:gameSlug/:kind/:id/recipes` path prefix.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The path prefix (no extension).
 */
const base = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/recipes`;

const collectionPath = (params) => `${base(params)}.json`;
const collectionAllPath = (params) => `${base(params)}/all.json`;
const singlePath = (params) => `${base(params)}/${params.characterRecipeId}.json`;
const singleFullPath = (params) => `${base(params)}/${params.characterRecipeId}/full.json`;
const availablePath = (params) => `${base(params)}/available.json`;
const availableAllPath = (params) => `${base(params)}/available/all.json`;
const acquirePath = (params) => `${base(params)}/acquire.json`;
const acquireAllPath = (params) => `${base(params)}/acquire/all.json`;
const removePath = (params) => `${base(params)}/remove.json`;
const removeAllPath = (params) => `${base(params)}/remove/all.json`;

const patchSingle = { path: singlePath, permission: null };

export default {
  GET: {
    collection: {
      regular: { path: collectionPath, permission: null },
      private: { path: collectionAllPath, permission: 'can_edit', skipCache: true },
    },
    single: {
      regular: { path: singlePath, permission: null },
      private: { path: singleFullPath, permission: 'can_edit', skipCache: true },
    },
    availableCollection: {
      regular: { path: availablePath, permission: null, skipCache: true },
      private: { path: availableAllPath, permission: 'can_edit', skipCache: true },
    },
  },
  POST: {
    acquire: {
      regular: { path: acquirePath, permission: null },
      private: { path: acquireAllPath, permission: 'can_edit' },
    },
    remove: {
      regular: { path: removePath, permission: null },
      private: { path: removeAllPath, permission: 'can_edit' },
    },
  },
  PATCH: {
    single: { regular: patchSingle, private: patchSingle },
  },
};
