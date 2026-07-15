import PollClient from '../../../../../client/PollClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Controller for the game poll detail page.
 *
 * @description Gated the same way as `GamePollsController`: visible to the
 *   game's DM(s), players, and admins, redirecting to the game page for
 *   anyone else, before ever calling the poll endpoint (which would
 *   otherwise 401/403).
 */
export default class GamePollController extends BasePageController {
  /**
   * Extract game slug and poll id from a poll detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Poll route params.
   */
  static getPollParamsFromHash(hash = '') {
    return BasePageController.extractParams('/games/:game_slug/polls/:id', hash, ['game_slug', 'id']);
  }

  /**
   * Create a game poll controller.
   *
   * @param {Function} setPoll - Poll setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {PollClient|null} [pollClient] - Poll client override.
   */
  constructor(setPoll, setLoading, setError, pollClient = null) {
    super();
    this.setPoll = setPoll;
    this.setLoading = setLoading;
    this.setError = setError;
    this.pollClient = pollClient ?? new PollClient();
  }

  /**
   * Build the page mount effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const { game_slug: gameSlug, id } = GamePollController.getPollParamsFromHash(hash);

      if (!gameSlug || !id) {
        safeSet(this.setError, 'Unable to load poll.');
        safeSet(this.setLoading, false);
      } else {
        AccessStore.ensureGameAccess(gameSlug)
          .then((access) => this.#handleAccess(access, gameSlug, id, safeSet))
          .catch(() => this.#redirectToGame(gameSlug));
      }

      return () => {
        mounted = false;
      };
    };
  }

  static #isAllowed(access) {
    return Boolean(access.is_dm || access.is_player || access.is_superuser || access.is_staff);
  }

  #handleAccess(access, gameSlug, id, safeSet) {
    if (!GamePollController.#isAllowed(access)) {
      this.#redirectToGame(gameSlug);
      return;
    }

    this.#fetchPoll(gameSlug, id, safeSet);
  }

  #redirectToGame(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}`;
    }
  }

  #fetchPoll(gameSlug, id, safeSet) {
    const token = AuthStorage.getToken();

    this.pollClient.fetchPoll(gameSlug, id, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('poll failed'))))
      .then((poll) => safeSet(this.setPoll, { ...poll, game_slug: gameSlug }))
      .catch(() => safeSet(this.setError, 'Unable to load poll.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
