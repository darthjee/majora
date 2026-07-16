const CHARACTER_ROUTE_PATTERNS = {
  pcCharacter: '/games/:game_slug/pcs/:character_id',
  npcCharacter: '/games/:game_slug/npcs/:character_id',
};

// Matches the game slug segment on any `/games/:game_slug/...` route, from
// the raw hash, so every game-scoped route resolves `gameSlug` without a
// hand-maintained per-page pattern entry. `/games/new` (game creation) is
// excluded by treating a captured `new` slug as absent.
const GAME_SLUG_PATTERN = /^#?\/games\/([^/?]+)/;

/**
 * Resolves the header's current route (page identifier and its params) from
 * a `HashRouteResolver`. Kept separate from {@link HeaderController} so this
 * route-parsing concern doesn't compete for line/complexity budget with the
 * header's own auth/health-check orchestration.
 */
export default class HeaderRouteResolver {
  /**
   * Resolves the current route (page identifier and its params), including
   * `gameSlug` for every route nested under `/games/:game_slug/...`, not
   * only the game show page.
   *
   * @param {import('../../../utils/routing/HashRouteResolver.js').default} routeResolver - resolver used to derive the current route.
   * @returns {{page: string, gameSlug: (string|undefined), characterId: (string|undefined)}} current route info.
   */
  static resolve(routeResolver) {
    const page = routeResolver.getPage();
    const characterPattern = CHARACTER_ROUTE_PATTERNS[page];

    if (characterPattern) {
      const params = routeResolver.getParams(characterPattern);
      return { page, gameSlug: params.game_slug, characterId: params.character_id };
    }

    const match = GAME_SLUG_PATTERN.exec(routeResolver.currentHash());
    const gameSlug = match && match[1] !== 'new' ? match[1] : undefined;

    return gameSlug ? { page, gameSlug } : { page };
  }
}
