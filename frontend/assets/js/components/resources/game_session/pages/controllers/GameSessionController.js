import GameSessionClient from '../../../../../client/GameSessionClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

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
      .then((session) => this.#renderSession(session.game_slug, session, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load session.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Render the session right away using AccessStore's synchronous, fail-closed
   * permissions reader, then re-render once the real value resolves in the
   * background so the page picks it up without blocking the first render on
   * the permissions fetch.
   *
   * @param {string} gameSlug - Game slug the session belongs to.
   * @param {object} session - Base session data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  #renderSession(gameSlug, session, safeSet) {
    safeSet(this.setSession, this.#mergePermissions(gameSlug, session));

    AccessStore.ensureGamePermissions(gameSlug)
      .then(() => safeSet(this.setSession, this.#mergePermissions(gameSlug, session)));
  }

  #mergePermissions(gameSlug, session) {
    return { ...session, ...AccessStore.getGamePermissions(gameSlug) };
  }

  /**
   * Submit a new date poll for the session.
   *
   * @description Marks the poll submission as in progress, sends a POST
   *   request, then redirects to the new poll's detail page on success
   *   (201), or marks the poll submission as failed otherwise (including
   *   network failures).
   * @param {string} gameSlug - Game slug.
   * @param {number|string} sessionId - Session id.
   * @param {string[]} dates - Candidate dates (YYYY-MM-DD), in submission order.
   * @param {string} type - Poll type (`single` or `multiple`).
   * @param {{setPollStatus: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitPoll(gameSlug, sessionId, dates, type, setters) {
    setters.setPollStatus('submitting');

    const token = AuthStorage.getToken();

    try {
      const response = await this.sessionClient.createSessionPoll(gameSlug, sessionId, token, dates, type);

      await this.#handlePollResponse(response, gameSlug, setters);
    } catch {
      setters.setPollStatus('error');
    }
  }

  async #handlePollResponse(response, gameSlug, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/polls/${data.id}`;
      }
      return;
    }

    setters.setPollStatus('error');
  }
}
