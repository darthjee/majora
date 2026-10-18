/**
 * Maximum number of games a token can be restricted to, mirroring the backend
 * `GAMES_MAX_COUNT`.
 *
 * @type {number}
 */
export const MAX_GAMES = 100;

/**
 * Apply a new games picker selection (issue #1605), ignoring any addition past `MAX_GAMES`
 * (removals always pass).
 *
 * @param {Array<{slug: string, name: string}>} value - Current selection.
 * @param {Array<{id: string, name: string}>} picked - The picker's new `{id, name}` selection.
 * @returns {Array<{slug: string, name: string}>} The new selection, or `value` when capped.
 */
export function applyGamesSelection(value, picked) {
  if (picked.length > value.length && picked.length > MAX_GAMES) return value;

  return picked.map(({ id, name }) => ({ slug: id, name }));
}
