import GameSessionClient from '../../../client/GameSessionClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Controller for the game session edit page.
 */
export default class GameSessionEditController extends BasePageController {
  /**
   * Extract game slug and session id from a session edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Session route params.
   */
  static getSessionParamsFromEditHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/sessions/:id/edit', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game session edit controller.
   *
   * @param {Function} setSession - Session setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameSessionClient|null} [sessionClient] - Session client override.
   */
  constructor(setSession, setLoading, setError, setFieldErrors = Noop.noop, sessionClient = null) {
    super();
    this.setSession = setSession;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
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
      const { game_slug: gameSlug, id } = GameSessionEditController.getSessionParamsFromEditHash(hash);

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

  /**
   * Submit a partial update for the session.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} id - Session id.
   * @param {{title: string, date: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, id, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.sessionClient.updateSession(gameSlug, id, token, {
        title: formValues.title,
        date: formValues.date || null,
      });

      await this.#handleResponse(response, gameSlug, id, setters);
    } catch {
      setters.setStatus('error');
    }
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

  async #handleResponse(response, gameSlug, id, setters) {
    if (response.ok) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/sessions/${id}`;
      }
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setStatus('error');
  }
}
