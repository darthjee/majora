/**
 * GET/mutation resource configuration for `task` (issue #842) — the first `resourceConfig`
 * entry for this resource, covering `GameTask` list/create/update endpoints.
 *
 * @description Unlike most other index pages, every `Task` endpoint 401/403s non-editors
 *   (`GameEditPermission`, DM-only) — the page controller (`GameTasksController`) already checks
 *   `game.can_edit` via `AccessStore.ensureGamePermissions` before ever calling through, and none
 *   of these endpoints has a separate restricted/full variant of its own, so every
 *   `regular`/`private` pair below points at the exact same object, mirroring
 *   `sessionConfig.js`'s `single` shape.
 *
 *   `GET.collection`/`POST.collection` (`fetchTasks`/`createTask`,
 *   `/games/:game_slug/tasks.json`) mirror `GameTaskClient`'s former methods of the same name,
 *   kept as separate objects (not a shared reference) mirroring `gameConfig.js`'s
 *   `collection`/`create` split. `PATCH.single` (`updateTask`, `/games/:game_slug/tasks/:id.json`)
 *   covers both the edit form and `GameTasksController#handleToggleCompleted`'s completed-flag
 *   toggle — both submit through the same endpoint.
 */
const collection = { path: ({ gameSlug }) => `/games/${gameSlug}/tasks.json`, permission: null };
const create = { path: ({ gameSlug }) => `/games/${gameSlug}/tasks.json`, permission: null };
const single = { path: ({ gameSlug, id }) => `/games/${gameSlug}/tasks/${id}.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
  },
  POST: {
    collection: { regular: create, private: create },
  },
  PATCH: {
    single: { regular: single, private: single },
  },
};
