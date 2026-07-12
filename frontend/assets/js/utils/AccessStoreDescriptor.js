import Router from './Router.js';

/**
 * Resolves a single {@link accessRouteConfig} descriptor into the
 * `AccessStore` ensure-call(s) it declares, used by `AccessStore#syncForRoute`.
 *
 * @description Kept separate from `AccessStore` itself so the (growing)
 *   per-resource-kind dispatch logic doesn't compete for line budget with the
 *   store's own fetch/cache orchestration methods.
 */
export default class AccessStoreDescriptor {
  /**
   * Trigger both the access and permissions fetch a page descriptor
   * declares for its resource (or the fixed superuser/staffOrSuperuser
   * identity check, which has no separate permissions fetch).
   *
   * @param {object} descriptor - Resolved descriptor (see {@link accessRouteConfig}).
   * @param {string} hash - Current hash, used to extract route params.
   * @param {typeof import('./AccessStore.js').default} store - `AccessStore` itself,
   *   passed in (rather than imported) to avoid a circular module dependency.
   * @returns {Promise<*>} Resolves once every triggered check settles.
   */
  static ensure(descriptor, hash, store) {
    if (descriptor.kind === 'superuser') {
      return store.ensureSuperUser();
    }

    if (descriptor.kind === 'staffOrSuperuser') {
      return store.ensureStaffOrSuperUser();
    }

    const params = Router.extractParams(descriptor.pattern, hash);
    const roles = descriptor.roles ?? [];

    if (descriptor.kind === 'game') {
      return AccessStoreDescriptor.#ensureGame(params[descriptor.params[0]], roles, store);
    }

    if (descriptor.kind === 'treasure') {
      return AccessStoreDescriptor.#ensureTreasure(params[descriptor.params[0]], roles, store);
    }

    return AccessStoreDescriptor.#ensureCharacter(descriptor, params, roles, store);
  }

  static #ensureGame(gameSlug, roles, store) {
    return Promise.all([
      store.ensureGameAccess(gameSlug),
      store.ensureGamePermissions(gameSlug, roles),
    ]);
  }

  static #ensureTreasure(treasureId, roles, store) {
    return Promise.all([
      store.ensureTreasureAccess(treasureId),
      store.ensureTreasurePermissions(treasureId, roles),
    ]);
  }

  static #ensureCharacter(descriptor, params, roles, store) {
    return Promise.all([
      store.ensureCharacterAccess(descriptor.characterKind, params.game_slug, params.character_id),
      store.ensureCharacterPermissions(descriptor.characterKind, params.game_slug, params.character_id, roles),
    ]);
  }
}
