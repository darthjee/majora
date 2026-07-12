/**
 * Cache-key builders for {@link AccessStore}, kept separate so the
 * key-shape concern (identity vs. permissions, plain resource vs.
 * role-scoped) doesn't clutter the store's own fetch/cache orchestration.
 */
export default class AccessStoreKeys {
  /**
   * Normalize a role list into a deterministic, deduplicated, sorted set,
   * so equivalent role combinations share the same permissions cache entry.
   *
   * @param {string[]} [roles] - Role names.
   * @returns {string[]} Sorted, deduplicated role names.
   */
  static normalizeRoles(roles) {
    return [...new Set(roles ?? [])].sort();
  }

  /**
   * Build the cache key for a game's identity access.
   *
   * @param {string} gameSlug - Game slug.
   * @returns {string} Cache key.
   */
  static game(gameSlug) {
    return `game:${gameSlug}`;
  }

  /**
   * Build the cache key for a character's identity access.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {string} Cache key.
   */
  static character(characterKind, gameSlug, characterId) {
    return `character:${characterKind}:${gameSlug}:${characterId}`;
  }

  /**
   * Build the cache key for a treasure's identity access.
   *
   * @param {string|number} id - Treasure id.
   * @returns {string} Cache key.
   */
  static treasure(id) {
    return `treasure:${id}`;
  }

  /**
   * Build the cache key for a game's edit permissions, scoped by role set.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string[]} roleSet - Normalized role set (see {@link AccessStoreKeys.normalizeRoles}).
   * @returns {string} Cache key.
   */
  static gamePermissions(gameSlug, roleSet) {
    return `permissions:game:${gameSlug}:${roleSet.join(',')}`;
  }

  /**
   * Build the cache key for a character's edit permissions, scoped by role set.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string[]} roleSet - Normalized role set (see {@link AccessStoreKeys.normalizeRoles}).
   * @returns {string} Cache key.
   */
  static characterPermissions(characterKind, gameSlug, characterId, roleSet) {
    return `permissions:character:${characterKind}:${gameSlug}:${characterId}:${roleSet.join(',')}`;
  }

  /**
   * Build the cache key for a treasure's edit permissions, scoped by role set.
   *
   * @param {string|number} id - Treasure id.
   * @param {string[]} roleSet - Normalized role set (see {@link AccessStoreKeys.normalizeRoles}).
   * @returns {string} Cache key.
   */
  static treasurePermissions(id, roleSet) {
    return `permissions:treasure:${id}:${roleSet.join(',')}`;
  }
}
