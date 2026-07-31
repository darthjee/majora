import Router from '../../routing/Router.js';

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

    if (descriptor.kind === 'game') {
      return AccessStoreDescriptor.#ensureGame(params[descriptor.params[0]], store);
    }

    if (descriptor.kind === 'treasure') {
      return AccessStoreDescriptor.#ensureTreasure(params[descriptor.params[0]], store);
    }

    return AccessStoreDescriptor.#ensureCharacter(descriptor, params, store);
  }

  static async #ensureGame(gameSlug, store) {
    await store.ensureGameAccess(gameSlug);

    return store.ensureGamePermissions(gameSlug);
  }

  static async #ensureTreasure(treasureId, store) {
    await store.ensureTreasureAccess(treasureId);

    return store.ensureTreasurePermissions(treasureId);
  }

  static async #ensureCharacter(descriptor, params, store) {
    await store.ensureCharacterAccess(descriptor.characterKind, params.game_slug, params.character_id);

    return store.ensureCharacterPermissions(descriptor.characterKind, params.game_slug, params.character_id);
  }
}
