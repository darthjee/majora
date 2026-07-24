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
  },
  treasure: {
    collection: ({ gameSlug, kind }) => (
      kind === 'game' || kind === 'npcs' ? AccessStore.ensureGamePermissions(gameSlug) : NO_PERMISSIONS()
    ),
  },
  document: {
    collection: ({ gameSlug, kind, id }) => AccessStore.ensureCharacterPermissions(kind, gameSlug, id),
    single: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
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
 *   `single`/`collection`'s `'game'` kind (`GameItem`, not a `CharacterItem`), and `document`
 *   `single` (`GameDocument`, issue #758) resolve `can_edit` at the *game* level
 *   (`GameEditPermission` on the backend); `npc`/`pc` `single`, `item` `single`/`collection`'s
 *   character kinds (`'pcs'`/`'npcs'`), and `document` `collection` resolve it at the *character*
 *   level (`CharacterEditPermission`) — for NPCs specifically the two happen to agree
 *   in practice (no owning player, so `Character.can_be_edited_by` reduces to the same
 *   dm/admin/superuser check as `Game.can_be_edited_by`), but each resource here is still resolved
 *   through whichever call actually matches its own backend permission class, not by relying on
 *   that coincidence. `item.availableCollection` (issue #773) is the one exception to the
 *   "character-scoped path resolves at the character level" pattern: it is always
 *   game-level-gated regardless of `kind`, matching `items/available/all.json`'s own DM-only
 *   `GameEditPermission` on the backend — see the resolver's own inline comment below.
 */
export default class RequestPermissionResolvers {
  /**
   * Resolve the current permissions object for a resource/quantity-type/params combination.
   *
   * @param {string} resource - Resource name (`'game'`, `'npc'`, `'pc'`, `'item'`, `'treasure'`,
   *   `'session'`, `'document'`).
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
