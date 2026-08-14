/**
 * GET/PATCH/POST resource configuration for `faction` (issue #812) — a game-scoped, name+photo
 * entity, closer to `sourceConfig.js`'s shape than `possessionConfig.js`'s: `GameFaction` has
 * **no** hidden/restricted concept of its own, so there is no separate `/all.json`/`/full.json`
 * variant for its own `GET.single`, and `regular`/`private` point at the exact same path object
 * there.
 *
 * @description `collection`/`single` params: `gameSlug` and, for `single`, `id` (the
 *   `GameFaction`'s own id). `resolveVariant.js` always reads `config.private.permission`, so
 *   `private` must still be present even though it's never actually selected for `single`
 *   (`permission: null` never grants).
 *
 *   `PATCH.single` (update) is **DM/staff only**, gated server-side by the shared `check_game_edit`
 *   helper (mirroring `GameItem`'s own `PATCH`, per the permissions correction documented in
 *   `docs/agents/plans/812-add-factions/plan.md`'s "Shared contracts" section) — `permission:
 *   'can_edit'` here mirrors `possessionConfig.js`'s own `PATCH.single` shape.
 *
 *   `POST.collection` (create) and `POST.single` (photo-upload init) are both gated by the
 *   broader `regular` (staff+player) tier server-side (`backend/permissions/config/game_faction/
 *   endpoints.yml`), not a plain `can_edit` boolean — `RequestStore`'s `permission` field only
 *   expresses simple `can_edit`-style checks, so `permission: null` here is documentation-only,
 *   mirroring how `sourceConfig.js` treats its own staff-gated-server-side-only endpoints. The
 *   real client-side gate lives on the "Create Faction" button/page instead (via
 *   `AccessStore.ensureGamePermissions`'s `can_create_faction`).
 *
 *   `collection` now (issue #943) doubles as the character-centric `CharacterFaction` listing,
 *   mirroring `itemConfig.js`'s/`possessionConfig.js`'s own dual-family `collection` branching:
 *   when `kind` is `'pcs'`/`'npcs'` (plus the character `id`), it resolves a PC's/NPC's own
 *   enlisted factions (`/games/:slug/:kind/:id/factions.json`, `+/all.json` for the character-level
 *   `can_edit`-gated hidden-inclusive variant) instead of the game's own `GameFaction` catalog —
 *   `kind` absent or `'game'` keeps the pre-existing game-level behavior untouched. `private`'s
 *   `permission` is therefore a function of params: `null` (never grants) for the game-level
 *   family, `'can_edit'` for the character-owned one.
 *
 *   `availableCollection`/`acquire`/`remove` (issue #943) back the faction exchange modal's
 *   Enlist/Quit tabs and the recruit modal, mirroring `documentConfig.js`'s own shape exactly
 *   (character-owned kinds only, `kind: 'pcs'|'npcs'`). `private` is the DM/admin-only endpoint
 *   variant accepting a hidden `GameFaction`/`CharacterFaction`; callers pass `variantName`
 *   explicitly for the `POST` entries (see `AcquireFactionTabController.js`/
 *   `RemoveFactionTabController.js`), so `permission` on those is documentation-only.
 *
 *   `characters` (issue #943) backs the faction show page's character-list panel: a faction's
 *   non-hidden `CharacterFaction`-linked characters (`/games/:slug/factions/:id/characters.json`),
 *   or every one of them, DM/admin only, always skipping cache (`/characters/all.json`). Params:
 *   `gameSlug`, `id` (the `GameFaction`'s own id).
 *
 *   `summary` (issue #943) backs the recruit modal's receiving list: whether a character is
 *   already enlisted in a given `GameFaction`. Params: `gameSlug`, `factionId`, `kind`, `id`.
 *   Mirrors `documentConfig.js`'s own `summary` entry exactly — `skipCache: true` on both variants
 *   (not worth caching), `private` gated by `can_edit` (character-level).
 */
const single = { path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}.json`, permission: null };
const update = { path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}.json`, permission: 'can_edit' };
const create = { path: ({ gameSlug }) => `/games/${gameSlug}/factions.json`, permission: null };
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}/photo_upload.json`,
  permission: null,
};

/**
 * Whether a `collection`/`availableCollection`/`acquire`/`remove` params object targets a
 * character-owned `CharacterFaction` family (`kind: 'pcs'|'npcs'`) rather than the game-level
 * `GameFaction` catalog.
 *
 * @param {object} params - Concrete params.
 * @param {string} [params.kind] - `'pcs'`, `'npcs'`, `'game'`, or absent (game-level).
 * @returns {boolean} Whether this is a character-owned request.
 */
function isCharacterOwned({ kind } = {}) {
  return kind === 'pcs' || kind === 'npcs';
}

const collectionRegular = {
  path: ({ gameSlug, kind, id }) => (isCharacterOwned({ kind })
    ? `/games/${gameSlug}/${kind}/${id}/factions.json`
    : `/games/${gameSlug}/factions.json`),
  permission: null,
};
const collectionPrivate = {
  path: ({ gameSlug, kind, id }) => (isCharacterOwned({ kind })
    ? `/games/${gameSlug}/${kind}/${id}/factions/all.json`
    : `/games/${gameSlug}/factions.json`),
  permission: (params) => (isCharacterOwned(params) ? 'can_edit' : null),
};

const availablePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/factions/available.json`;
const availableAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/factions/available/all.json`;

const acquirePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/factions/acquire.json`;
const acquireAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/factions/acquire/all.json`;

const removePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/factions/remove.json`;
const removeAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/factions/remove/all.json`;

const charactersPath = ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}/characters.json`;
const charactersAllPath = ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}/characters/all.json`;

// Per-character faction-membership summary paths (issue #943's recruit modal). `factionId` is the
// `GameFaction` being recruited into; `kind`/`id` identify the browsed character.
const summaryPath = ({
  gameSlug, factionId, kind, id,
}) => `/games/${gameSlug}/factions/${factionId}/${kind}/${id}/summary.json`;
const summaryAllPath = ({
  gameSlug, factionId, kind, id,
}) => `/games/${gameSlug}/factions/${factionId}/${kind}/${id}/summary/all.json`;

export default {
  GET: {
    collection: { regular: collectionRegular, private: collectionPrivate },
    single: { regular: single, private: single },
    availableCollection: {
      regular: { path: availablePath, permission: null },
      private: { path: availableAllPath, permission: 'can_edit' },
    },
    characters: {
      regular: { path: charactersPath, permission: null },
      private: { path: charactersAllPath, permission: 'can_edit', skipCache: true },
    },
    summary: {
      regular: { path: summaryPath, permission: null, skipCache: true },
      private: { path: summaryAllPath, permission: 'can_edit', skipCache: true },
    },
  },
  PATCH: {
    single: { regular: update, private: update },
  },
  POST: {
    collection: { regular: create, private: create },
    single: { regular: photoUploadInit, private: photoUploadInit },
    acquire: {
      regular: { path: acquirePath, permission: null },
      private: { path: acquireAllPath, permission: 'can_edit' },
    },
    remove: {
      regular: { path: removePath, permission: null },
      private: { path: removeAllPath, permission: 'can_edit' },
    },
  },
};
