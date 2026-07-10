/**
 * Route-to-access configuration consumed by {@link AccessStore#syncForRoute}.
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
 */
export default {
  game: [{ kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] }],
  gameEdit: [{ kind: 'game', pattern: '/games/:game_slug/edit', params: ['game_slug'] }],
  gameNpcs: [{ kind: 'game', pattern: '/games/:game_slug/npcs', params: ['game_slug'] }],
  gamePhotos: [{ kind: 'game', pattern: '/games/:game_slug/photos', params: ['game_slug'] }],
  gameTasks: [{ kind: 'game', pattern: '/games/:game_slug/tasks', params: ['game_slug'] }],
  gameTreasures: [{ kind: 'game', pattern: '/games/:game_slug/treasures', params: ['game_slug'] }],
  gameSessions: [{ kind: 'game', pattern: '/games/:game_slug/sessions', params: ['game_slug'] }],
  gameNpcNew: [{ kind: 'game', pattern: '/games/:game_slug/npcs/new', params: ['game_slug'] }],
  gameSessionNew: [{ kind: 'game', pattern: '/games/:game_slug/sessions/new', params: ['game_slug'] }],
  gameTreasureNew: [{ kind: 'game', pattern: '/games/:game_slug/treasures/new', params: ['game_slug'] }],
  gameTreasureEdit: [
    { kind: 'game', pattern: '/games/:game_slug/treasures/:treasure_id/edit', params: ['game_slug'] },
  ],
  pcCharacter: [{
    kind: 'character', characterKind: 'pcs',
    pattern: '/games/:game_slug/pcs/:character_id', params: ['game_slug', 'character_id'],
  }],
  npcCharacter: [{
    kind: 'character', characterKind: 'npcs',
    pattern: '/games/:game_slug/npcs/:character_id', params: ['game_slug', 'character_id'],
  }],
  pcCharacterEdit: [{
    kind: 'character', characterKind: 'pcs',
    pattern: '/games/:game_slug/pcs/:character_id/edit', params: ['game_slug', 'character_id'],
  }],
  npcCharacterEdit: [{
    kind: 'character', characterKind: 'npcs',
    pattern: '/games/:game_slug/npcs/:character_id/edit', params: ['game_slug', 'character_id'],
  }],
  pcCharacterPhotos: [{
    kind: 'character', characterKind: 'pcs',
    pattern: '/games/:game_slug/pcs/:character_id/photos', params: ['game_slug', 'character_id'],
  }],
  npcCharacterPhotos: [{
    kind: 'character', characterKind: 'npcs',
    pattern: '/games/:game_slug/npcs/:character_id/photos', params: ['game_slug', 'character_id'],
  }],
  pcCharacterTreasures: [{
    kind: 'character', characterKind: 'pcs',
    pattern: '/games/:game_slug/pcs/:character_id/treasures', params: ['game_slug', 'character_id'],
  }],
  npcCharacterTreasures: [{
    kind: 'character', characterKind: 'npcs',
    pattern: '/games/:game_slug/npcs/:character_id/treasures', params: ['game_slug', 'character_id'],
  }],
  treasure: [{ kind: 'treasure', pattern: '/treasures/:treasure_id', params: ['treasure_id'] }],
  treasureEdit: [
    { kind: 'superuser' },
    { kind: 'treasure', pattern: '/treasures/:treasure_id/edit', params: ['treasure_id'] },
  ],
  treasureNew: [{ kind: 'superuser' }],
  treasures: [{ kind: 'superuser' }],
  staffUsers: [{ kind: 'staffOrSuperuser' }],
  staffUser: [{ kind: 'staffOrSuperuser' }],
  staffUserEdit: [{ kind: 'staffOrSuperuser' }],
};
