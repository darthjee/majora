import AccessStore from '../access/store/AccessStore.js';

const NO_PERMISSIONS = () => Promise.resolve({});

const RESOLVERS = {
  npc: {
    collection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
    single: ({ gameSlug, id }) => AccessStore.ensureCharacterPermissions('npcs', gameSlug, id),
  },
  pc: {
    single: ({ gameSlug, id }) => AccessStore.ensureCharacterPermissions('pcs', gameSlug, id),
  },
  item: {
    collection: ({ gameSlug, kind, id }) => (kind === 'game'
      ? AccessStore.ensureGamePermissions(gameSlug)
      : AccessStore.ensureCharacterPermissions(kind, gameSlug, id)),
    single: ({ gameSlug, kind, id }) => (kind === 'game'
      ? AccessStore.ensureGamePermissions(gameSlug)
      : AccessStore.ensureCharacterPermissions(kind, gameSlug, id)),
    // Unconditionally game-level, unlike `collection`/`single` above: `availableCollection`
    // (issue #773) always backs a character-scoped path (`kind` is always `'pcs'|'npcs'`, never
    // `'game'`), but its `private` variant (`items/available/all.json`) is authorized by the
    // DM-only `GameEditPermission` on the backend, not `CharacterEditPermission` — a PC's owning
    // player must not get hidden-catalog visibility just by owning the character. Do not "fix"
    // this into branching on `kind` like `collection`/`single` do; that would incorrectly grant
    // an owning player elevated catalog access.
    availableCollection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
    // issue #827: resolved character-level, mirroring `single`/`collection`'s own character-kind
    // branch — the `summary` config entry's `private` permission key is `can_edit` for both
    // `kind: 'pcs'` and `kind: 'npcs'` (see `itemConfig.js`'s own comment), so this resolver's
    // result is consulted for both kinds.
    summary: ({ gameSlug, kind, id }) => AccessStore.ensureCharacterPermissions(kind, gameSlug, id),
  },
  // issue #1076: `possession` now covers both a game's own `GamePossession`s (`kind: 'game'`,
  // issue #1074) and a PC's/NPC's held `CharacterPossession`s (`kind: 'pcs'|'npcs'`), so
  // `collection`/`single` branch on `kind` exactly like `item`'s own resolver does.
  possession: {
    collection: ({ gameSlug, kind, id }) => (kind === 'game'
      ? AccessStore.ensureGamePermissions(gameSlug)
      : AccessStore.ensureCharacterPermissions(kind, gameSlug, id)),
    single: ({ gameSlug, kind, id }) => (kind === 'game'
      ? AccessStore.ensureGamePermissions(gameSlug)
      : AccessStore.ensureCharacterPermissions(kind, gameSlug, id)),
    // Unconditionally game-level, mirroring `item.availableCollection`/`document.availableCollection`
    // exactly: `availableCollection` always backs a character-scoped path (`kind` is always
    // `'pcs'|'npcs'`), but its `private` variant (`possessions/available/all.json`) is authorized
    // by the DM-only `GameEditPermission` on the backend, not `CharacterEditPermission` — a PC's
    // owning player must not get hidden-catalog visibility just from owning the character.
    availableCollection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
  },
  treasure: {
    collection: ({ gameSlug, kind }) => (
      kind === 'game' || kind === 'npcs' ? AccessStore.ensureGamePermissions(gameSlug) : NO_PERMISSIONS()
    ),
  },
  document: {
    collection: ({ gameSlug, kind, id }) => AccessStore.ensureCharacterPermissions(kind, gameSlug, id),
    // Branches on `kind` like `item.single` does (issue #892): `'game'` resolves the `GameDocument`
    // detail (issue #758) at the game level, while `'pcs'|'npcs'` resolves the `CharacterDocument`
    // detail at the character level.
    single: ({ gameSlug, kind, id }) => (kind === 'game'
      ? AccessStore.ensureGamePermissions(gameSlug)
      : AccessStore.ensureCharacterPermissions(kind, gameSlug, id)),
    // Deliberately its own quantity-type key, not `collection`, since `collection` above already
    // resolves at the character level for `GET`'s `CharacterDocument` reads — a bare game-level
    // `GameDocument` create has no character to resolve against.
    gameCollection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
    // Unconditionally game-level, mirroring `item.availableCollection` exactly (issue #920):
    // `availableCollection` always backs a character-scoped path (`kind` is always
    // `'pcs'|'npcs'`), but its `private` variant (`documents/available/all.json`) is authorized
    // by the DM-only `GameEditPermission` on the backend, not `CharacterEditPermission` — a PC's
    // owning player must not get hidden-catalog visibility just from owning the character.
    availableCollection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
    // issue #1005: resolved character-level, mirroring `item.summary` exactly — the `summary`
    // config entry's `private` permission key is `can_edit` for both `kind: 'pcs'` and
    // `kind: 'npcs'`, so this resolver's result is consulted for both kinds, letting
    // `RequestStore.ensure` auto-pick the `private` variant for an authorized (staff/owning-
    // player) caller without the give-document modal having to decide explicitly.
    summary: ({ gameSlug, kind, id }) => AccessStore.ensureCharacterPermissions(kind, gameSlug, id),
  },
};

/**
 * Resolves the live `{ can_edit }`-shaped permissions object a {@link Request} should evaluate
 * its configured `resourceConfig` permission key against, by delegating to the appropriate
 * `AccessStore.ensure*Permissions` call for the given resource/quantity-type/params — the same
 * calls page controllers already make today. Kept separate from {@link RequestStore} so the
 * resource-to-permission-scope mapping (flagged for security review by issue #778) isn't
 * tangled with the store's own bookkeeping.
 *
 * @description See `docs/agents/access-control/character-item.md`, `character-treasure.md`,
 *   `game-item.md`, `game-treasure.md`, and `game-document.md` for the endpoints this mirrors.
 *   `npc` `collection`, the `'game'`- and NPC-`kind` `treasure` `collection`, `item`
 *   `single`/`collection`'s `'game'` kind (`GameItem`, not a `CharacterItem`), `document`
 *   `single`'s `'game'` kind (`GameDocument`, issue #758), and `document` `gameCollection`
 *   (`GameDocument` creation, issue #841) resolve `can_edit` at the *game* level
 *   (`GameEditPermission` on the backend); `npc`/`pc` `single`, `item` `single`/`collection`'s
 *   character kinds (`'pcs'`/`'npcs'`), `document` `collection`, and `document` `single`'s
 *   character kinds (`'pcs'`/`'npcs'`, `CharacterDocument`, issue #892) resolve it at the
 *   *character* level (`CharacterEditPermission`) — for NPCs specifically the two happen to agree
 *   in practice (no owning player, so `Character.can_be_edited_by` reduces to the same
 *   dm/admin/superuser check as `Game.can_be_edited_by`), but each resource here is still resolved
 *   through whichever call actually matches its own backend permission class, not by relying on
 *   that coincidence. `possession` (issue #1076) now mirrors `item`'s own dual-family `single`/
 *   `collection` branching exactly, on top of its pre-existing `'game'`-only shape from issue
 *   #1074. `item.availableCollection`/`document.availableCollection`/`possession.availableCollection`
 *   are the one exception to the "character-scoped path resolves at the character level" pattern:
 *   they are always game-level-gated regardless of `kind`, matching their `/available/all.json`
 *   variant's own DM-only `GameEditPermission` on the backend — see each resolver's own inline
 *   comment below.
 *
 *   `poll`, `task`, and `staffUser` (issue #842) intentionally have no entry here at all: every
 *   variant in their `resourceConfig` files has `permission: null` and an identical
 *   `regular`/`private` object (no restricted/full split to resolve), so the default
 *   `NO_PERMISSIONS()` fallback below is already correct for them — the page controllers'
 *   own `AccessStore.ensureGameAccess`/`ensureGamePermissions`/`ensureStaffOrSuperUser` gates
 *   handle the real access control before ever calling through.
 */
export default class RequestPermissionResolvers {
  /**
   * Resolve the current permissions object for a resource/quantity-type/params combination.
   *
   * @param {string} resource - Resource name (`'game'`, `'npc'`, `'pc'`, `'item'`, `'possession'`,
   *   `'treasure'`, `'session'`, `'document'`, `'poll'`, `'task'`, `'staffUser'`).
   * @param {string} quantityType - `'collection'` or `'single'`.
   * @param {object} params - Concrete params (`gameSlug`, `kind`, `id`, etc.).
   * @returns {Promise<object>} Resolves to the permissions object (e.g. `{ can_edit: boolean }`),
   *   or `{}` when this resource/quantity-type has no restricted variant at all.
   */
  static resolve(resource, quantityType, params) {
    const resolver = RESOLVERS[resource]?.[quantityType];

    return resolver ? resolver(params) : NO_PERMISSIONS();
  }
}
