import GameSessionClient from '../../../../../client/GameSessionClient.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Controller for the game session detail page.
 */
export default class GameSessionController extends BasePageController {
  /**
   * Extract game slug and session id from a session detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Session route params.
   */
  static getSessionParamsFromHash(hash = '') {
    return BasePageController.extractParams('/games/:game_slug/sessions/:id', hash, ['game_slug', 'id']);
  }

  /**
   * Create a game session controller.
   *
   * @param {Function} setSession - Session setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GameSessionClient|null} [sessionClient] - Session client override.
   */
  constructor(setSession, setLoading, setError, sessionClient = null) {
    super();
    this.setSession = setSession;
    this.setLoading = setLoading;
    this.setError = setError;
    this.sessionClient = sessionClient ?? new GameSessionClient();
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const { game_slug: gameSlug, id } = GameSessionController.getSessionParamsFromHash(hash);

      if (!gameSlug || !id) {
        safeSet(this.setError, 'Unable to load session.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchSession(gameSlug, id, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchSession(gameSlug, id, safeSet) {
    const token = AuthStorage.getToken();

    this.sessionClient.fetchSession(gameSlug, id, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('session failed'))))
      .then((session) => safeSet(this.setSession, session))
      .catch(() => safeSet(this.setError, 'Unable to load session.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
