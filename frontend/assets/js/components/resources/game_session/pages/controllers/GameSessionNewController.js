import GameSessionClient from '../../../../../client/GameSessionClient.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import AccessStore from '../../../../../utils/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game session creation page.
 */
export default class GameSessionNewController extends BasePageController {
  /**
   * Extract game slug from a session creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromSessionNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/sessions/new', 'game_slug', hash);
  }

  /**
   * Create a game session new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameSessionClient|null} [sessionClient] - Session client override.
   */
  constructor(setError, setFieldErrors = Noop.noop, sessionClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.sessionClient = sessionClient ?? new GameSessionClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may
   *   edit the game and redirects to the sessions index when they cannot.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const gameSlug = GameSessionNewController.getGameSlugFromSessionNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToSessions(gameSlug));
    };
  }

  /**
   * Submit the new session form.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a POST request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{title: string, date: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.sessionClient.createSession(gameSlug, token, {
        title: formValues.title,
        date: formValues.date || null,
      });

      await this.#handleResponse(response, gameSlug, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_edit) {
      this.#redirectToSessions(gameSlug);
    }
  }

  #redirectToSessions(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/sessions`;
    }
  }

  async #handleResponse(response, gameSlug, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/sessions/${data.id}`;
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
