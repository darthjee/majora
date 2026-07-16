// Matches the game slug segment on any `/games/:game_slug/...` route, from
// the raw hash, so every game-scoped route resolves the game slug without a
// hand-maintained per-page pattern entry. `/games/new` (game creation) is
// excluded by treating a captured `new` slug as absent.
const GAME_SLUG_PATTERN = /^#?\/games\/([^/?]+)/;

/**
 * Extracts the game slug from a raw hash, shared by every call site that
 * needs "which game, if any, does this hash belong to" (currently
 * {@link HeaderRouteResolver} and `AccessStore`), so both resolve identical
 * semantics from a single implementation.
 *
 * @param {string} hash - Raw hash (with or without the leading `#`).
 * @returns {string|undefined} The game slug, or `undefined` when the hash
 *   does not belong to a game-scoped route (or is the game-creation route).
 */
export default function gameSlugFromHash(hash) {
  const match = GAME_SLUG_PATTERN.exec(hash ?? '');

  return match && match[1] !== 'new' ? match[1] : undefined;
}
