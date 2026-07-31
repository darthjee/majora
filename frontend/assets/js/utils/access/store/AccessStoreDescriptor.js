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
   * identity check, which has no separate permissions fetch). A treasure
   * descriptor is the one exception: it triggers only the access fetch —
   * see {@link AccessStoreDescriptor.#ensureTreasure}.
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

  /**
   * Trigger only the identity access fetch for a treasure descriptor — unlike
   * `game`/`character`, `ensureTreasurePermissions` is deliberately not called here.
   *
   * @description Since #926's amendment, a treasure's edit-permissions route depends on whether
   *   it is game-exclusive (see `docs/agents/access-control/treasure.md`'s "Edit permission"
   *   section), a fact only known once the page's own detail fetch (which carries `game_slug`)
   *   resolves — this route-level descriptor only has the treasure id from the URL, not its
   *   detail. Eagerly guessing "global" here (as a stale default) would risk winning the race
   *   against the page controller's correctly-informed call and caching the wrong route's result
   *   under the shared cache key. So the page controllers (`TreasureController`,
   *   `TreasureEditController`) are the sole callers of `ensureTreasurePermissions` for treasures.
   * @param {string|number} treasureId - Treasure id, extracted from the route.
   * @param {typeof import('./AccessStore.js').default} store - `AccessStore` itself.
   * @returns {Promise<object>} Resolves to the access payload.
   */
  static #ensureTreasure(treasureId, store) {
    return store.ensureTreasureAccess(treasureId);
  }

  static async #ensureCharacter(descriptor, params, store) {
    await store.ensureCharacterAccess(descriptor.characterKind, params.game_slug, params.character_id);

    return store.ensureCharacterPermissions(descriptor.characterKind, params.game_slug, params.character_id);
  }
}
