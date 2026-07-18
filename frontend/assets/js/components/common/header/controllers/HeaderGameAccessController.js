import AccessStore from '../../../../utils/access/store/AccessStore.js';

/**
 * Manages fetching the current game's access flags (`is_dm`/`is_player`/
 * `is_superuser`/`is_staff`) for the header, used to gate the "Game" nav
 * dropdown's Polls/Sessions items to the game's DM(s), players, and admins —
 * the same audience rule already used by `OpenPollsWidget`/`GamePollsController`.
 * Kept separate from {@link HeaderController} so this small, focused concern
 * doesn't compete for line/complexity budget with the header's own
 * auth/route/health-check orchestration — mirrors {@link HeaderViewAsController}.
 */
export default class HeaderGameAccessController {
  /**
   * Creates a new HeaderGameAccessController instance.
   *
   * @param {Function} setGameAccess - state setter for the current game's access flags.
   * @param {typeof AccessStore} [accessStore] - store used to resolve the game's access flags.
   */
  constructor(setGameAccess, accessStore = AccessStore) {
    this.setGameAccess = setGameAccess;
    this.accessStore = accessStore;
  }

  /**
   * Builds the effect used to fetch the current game's access flags whenever
   * the route resolves a game slug. No-ops when there is no game slug.
   *
   * @param {string|undefined} gameSlug - Currently resolved game slug, or undefined.
   * @returns {Function} Effect callback returning a cleanup function (or undefined
   *   when there is no game slug to fetch access for).
   */
  buildEffect(gameSlug) {
    return () => {
      if (!gameSlug) {
        return undefined;
      }

      let mounted = true;

      this.accessStore.ensureGameAccess(gameSlug).then((access) => {
        if (mounted) {
          this.setGameAccess(access);
        }
      });

      return () => {
        mounted = false;
      };
    };
  }
}
