import AccessRouteConfigStore from './AccessRouteConfigStore.js';

/**
 * Route-to-access configuration consumed by {@link AccessStore#syncForRoute}
 * through {@link module:accessRouteConfig.get}.
 *
 * @description Keyed by the page identifiers returned by
 *   `HashRouteResolver#getPage` (the second argument of each
 *   `Router#register` call in `HashRouteResolver.js`). Each value is an
 *   array of descriptors describing the access check(s) required by that
 *   page, in one of three shapes:
 *   - `{ kind: 'game', pattern, params: [gameSlugParamName] }`
 *   - `{ kind: 'character', characterKind, pattern, params: ['game_slug', 'character_id'] }`
 *   - `{ kind: 'treasure', pattern, params: [treasureIdParamName] }`
 *   - `{ kind: 'superuser' }`
 *   - `{ kind: 'staffOrSuperuser' }`
 *   Page keys with no current access check (e.g. `games`, `home`) have no entry.
 *
 *   `pattern`/`params` stay frontend-owned (pure URL routing, mirroring
 *   `HashRouteResolver`'s own patterns). `kind` (and `characterKind`) for the
 *   `game`/`character`/`treasure` descriptors are resolved lazily, at lookup
 *   time, from {@link AccessRouteConfigStore} — the backend's resource-kind
 *   config — falling back to this app's pre-existing hardcoded values until
 *   that config has loaded. The `superuser`/`staffOrSuperuser` descriptors
 *   stay hardcoded literals: they check a fixed identity fact (not a specific
 *   resource), so they are never looked up in the backend's per-resource
 *   config, and must not collapse into a generic access/permissions fetch.
 */
const ROUTE_TEMPLATES = {
  game: [{ pattern: '/games/:game_slug', params: ['game_slug'] }],
  gameEdit: [{ pattern: '/games/:game_slug/edit', params: ['game_slug'] }],
  gameNpcs: [{ pattern: '/games/:game_slug/npcs', params: ['game_slug'] }],
  gamePhotos: [{ pattern: '/games/:game_slug/photos', params: ['game_slug'] }],
  gameTasks: [{ pattern: '/games/:game_slug/tasks', params: ['game_slug'] }],
  gamePolls: [{ pattern: '/games/:game_slug/polls', params: ['game_slug'] }],
  gamePoll: [{ pattern: '/games/:game_slug/polls/:id', params: ['game_slug'] }],
  gameTreasures: [{ pattern: '/games/:game_slug/treasures', params: ['game_slug'] }],
  gameSessions: [{ pattern: '/games/:game_slug/sessions', params: ['game_slug'] }],
  gameNpcNew: [{ pattern: '/games/:game_slug/npcs/new', params: ['game_slug'] }],
  gamePollNew: [{ pattern: '/games/:game_slug/polls/new', params: ['game_slug'] }],
  gameSessionNew: [{ pattern: '/games/:game_slug/sessions/new', params: ['game_slug'] }],
  gameTreasureNew: [{ pattern: '/games/:game_slug/treasures/new', params: ['game_slug'] }],
  gameTreasureEdit: [
    { pattern: '/games/:game_slug/treasures/:treasure_id/edit', params: ['game_slug'] },
  ],
  pcCharacter: [{
    pattern: '/games/:game_slug/pcs/:character_id', params: ['game_slug', 'character_id'],
  }],
  npcCharacter: [{
    pattern: '/games/:game_slug/npcs/:character_id', params: ['game_slug', 'character_id'],
  }],
  pcCharacterEdit: [{
    pattern: '/games/:game_slug/pcs/:character_id/edit', params: ['game_slug', 'character_id'],
  }],
  npcCharacterEdit: [{
    pattern: '/games/:game_slug/npcs/:character_id/edit', params: ['game_slug', 'character_id'],
  }],
  pcCharacterPhotos: [{
    pattern: '/games/:game_slug/pcs/:character_id/photos', params: ['game_slug', 'character_id'],
  }],
  npcCharacterPhotos: [{
    pattern: '/games/:game_slug/npcs/:character_id/photos', params: ['game_slug', 'character_id'],
  }],
  pcCharacterTreasures: [{
    pattern: '/games/:game_slug/pcs/:character_id/treasures', params: ['game_slug', 'character_id'],
  }],
  npcCharacterTreasures: [{
    pattern: '/games/:game_slug/npcs/:character_id/treasures', params: ['game_slug', 'character_id'],
  }],
  treasure: [{ pattern: '/treasures/:treasure_id', params: ['treasure_id'] }],
  treasureEdit: [
    { kind: 'superuser' },
    { pattern: '/treasures/:treasure_id/edit', params: ['treasure_id'] },
  ],
  treasureNew: [{ kind: 'superuser' }],
  treasures: [{ kind: 'superuser' }],
  staffUsers: [{ kind: 'staffOrSuperuser' }],
  staffUser: [{ kind: 'staffOrSuperuser' }],
  staffUserEdit: [{ kind: 'staffOrSuperuser' }],
};

/**
 * Resolve a single descriptor template's `kind`/`characterKind`, either from
 * its own hardcoded literal (`superuser`/`staffOrSuperuser`) or from
 * {@link AccessRouteConfigStore}, keyed by the owning page.
 *
 * @param {string} pageKey - Resolved page identifier the template belongs to.
 * @param {object} template - Descriptor template (see module doc).
 * @returns {object} The fully resolved descriptor.
 */
function resolveDescriptor(pageKey, template) {
  if (template.kind) {
    return template;
  }

  const resolved = AccessRouteConfigStore.getKind(pageKey) ?? {};
  const characterKind = resolved.characterKind ? { characterKind: resolved.characterKind } : {};

  return { ...template, kind: resolved.kind, ...characterKind };
}

export default {
  /**
   * Resolve the access-check descriptors for a page.
   *
   * @param {string} pageKey - Resolved page identifier (as returned by
   *   `HashRouteResolver#getPage`).
   * @returns {object[]} Array of resolved descriptors (see module doc), or
   *   `[]` when the page has no access check.
   */
  get(pageKey) {
    const templates = ROUTE_TEMPLATES[pageKey];

    return templates ? templates.map((template) => resolveDescriptor(pageKey, template)) : [];
  },
};
