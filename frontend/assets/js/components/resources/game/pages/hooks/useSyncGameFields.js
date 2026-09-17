import { useEffect } from 'react';

/**
 * Whether the current user may reach the game edit page (full editor, any player of the game, or
 * any Staff account), matching the same `canReachEditPage` shape already used by the character
 * edit page (issue #891).
 *
 * @param {object} game - Loaded game data object.
 * @param {boolean} [game.can_edit] - Whether the current user is a full (dm/admin) editor.
 * @param {boolean} [game.is_player] - Whether the current user is a player of the game.
 * @param {boolean} [game.is_staff] - Whether the current user is a Staff account.
 * @returns {boolean} Whether the edit page is reachable for this game/user pair.
 */
function canReachEditPage(game) {
  return Boolean(game.can_edit || game.is_player || game.is_staff);
}

/**
 * Wires GameEdit's field-sync/redirect effect: redirects away from the edit page when the loaded
 * `game` isn't reachable by the current user, otherwise syncs `name`/`description`/`links` from
 * `game` into local form state.
 *
 * @param {object} game - Loaded game data object, or `null` while still loading.
 * @param {string} gameSlug - Current game's slug, used to build the redirect target.
 * @param {Function} setField - Form-state setter, called as `setField(name, value)`.
 * @param {Function} setLinks - State setter for the game's links.
 * @returns {void}
 */
export default function useSyncGameFields(game, gameSlug, setField, setLinks) {
  useEffect(() => {
    if (!game) return;

    if (!canReachEditPage(game)) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}`;
      }
      return;
    }

    setField('name', game.name ?? '');
    setField('description', game.description ?? '');
    setLinks(game.links ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);
}

export { canReachEditPage };
