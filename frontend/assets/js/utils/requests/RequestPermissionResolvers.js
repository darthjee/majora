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
    collection: ({ gameSlug, kind, id }) => AccessStore.ensureCharacterPermissions(kind, gameSlug, id),
    single: ({ gameSlug, kind, id }) => AccessStore.ensureCharacterPermissions(kind, gameSlug, id),
  },
  treasure: {
    collection: ({ gameSlug, kind }) => (kind === 'npcs' ? AccessStore.ensureGamePermissions(gameSlug) : NO_PERMISSIONS()),
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
 * @description See `docs/agents/access-control/character-item.md` and `character-treasure.md`
 *   for the endpoints this mirrors. `npc` `collection` and the NPC-`kind` `treasure` `collection`
 *   resolve `can_edit` at the *game* level (`GameEditPermission` on the backend); `npc`/`pc`
 *   `single` and `item` (either `kind`) resolve it at the *character* level
 *   (`CharacterEditPermission`) — for NPCs specifically the two happen to agree in practice (no
 *   owning player, so `Character.can_be_edited_by` reduces to the same dm/admin/superuser check
 *   as `Game.can_be_edited_by`), but each resource here is still resolved through whichever call
 *   actually matches its own backend permission class, not by relying on that coincidence.
 */
export default class RequestPermissionResolvers {
  /**
   * Resolve the current permissions object for a resource/quantity-type/params combination.
   *
   * @param {string} resource - Resource name (`'game'`, `'npc'`, `'pc'`, `'item'`, `'treasure'`).
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
