import AccessStore from '../../../../utils/access/store/AccessStore.js';
import AccessEvents from '../../../../utils/access/AccessEvents.js';

/**
 * Manages fetching the current game's access flags (`is_dm`/`is_player`/
 * `is_superuser`/`is_staff`) for the header, used to gate the "Game" nav
 * dropdown's Polls/Sessions items to the game's DM(s), players, and admins —
 * the same audience rule already used by `OpenPollsWidget`/`GamePollsController`.
 * Kept separate from {@link HeaderController} so this small, focused concern
 * doesn't compete for line/complexity budget with the header's own
 * auth/route/health-check orchestration — mirrors {@link HeaderViewAsController}.
 *
 * @description On the initial mount of any game-scoped route, `Header`'s own
 *   `ensureGameAccess` call races `AppController`'s route sync, which calls
 *   `AccessStore.reset()` and aborts whichever request was already in flight.
 *   To stay correct regardless of who wins that race, this controller both
 *   (a) subscribes to `AccessEvents` for the lifetime of the effect and
 *   re-reads the cache on every settle — picking up whichever fetch actually
 *   resolves, including one restarted by the app-level route sync — and
 *   (b) re-issues its own `ensureGameAccess` call once, if its first
 *   resolution looks like the cache's fail-closed abort default, so pages
 *   with no app-level `'game'` access descriptor (e.g. the Players page)
 *   still recover.
 */
export default class HeaderGameAccessController {
  /**
   * Creates a new HeaderGameAccessController instance.
   *
   * @param {Function} setGameAccess - state setter for the current game's access flags.
   * @param {typeof AccessStore} [accessStore] - store used to resolve the game's access flags.
   * @param {typeof AccessEvents} [accessEvents] - event bus used to react to later access settles.
   */
  constructor(setGameAccess, accessStore = AccessStore, accessEvents = AccessEvents) {
    this.setGameAccess = setGameAccess;
    this.accessStore = accessStore;
    this.accessEvents = accessEvents;
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

      const state = { mounted: true, retried: false };

      this.#fetchAccess(gameSlug, state);

      const handleAccessChanged = () => this.#applyAccess(this.accessStore.getGameAccess(gameSlug), state);

      this.accessEvents.subscribe(handleAccessChanged);

      return () => {
        state.mounted = false;
        this.accessEvents.unsubscribe(handleAccessChanged);
      };
    };
  }

  #fetchAccess(gameSlug, state) {
    return this.accessStore.ensureGameAccess(gameSlug).then((access) => {
      this.#applyAccess(access, state);
      this.#retryIfAborted(gameSlug, state, access);
    });
  }

  #retryIfAborted(gameSlug, state, access) {
    if (state.retried || !HeaderGameAccessController.#isAbortedDefault(access)) {
      return;
    }

    state.retried = true;
    this.#fetchAccess(gameSlug, state);
  }

  #applyAccess(access, state) {
    if (state.mounted) {
      this.setGameAccess(access);
    }
  }

  static #isAbortedDefault(access) {
    return access.is_player === false
      && access.is_dm === null
      && access.is_staff === null
      && access.is_superuser === null;
  }
}
