import GameClient from '../../../client/GameClient.js';
import GameSessionClient from '../../../client/GameSessionClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import Noop from '../../../utils/Noop.js';

/**
 * Extract game slug from a session creation hash.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromSessionNewHash(hash = '') {
  return Router.extractParams('/games/:game_slug/sessions/new', hash).game_slug ?? '';
}

/**
 * Controller for the game session creation page.
 */
export default class GameSessionNewController extends BasePageController {
  /**
   * Create a game session new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameSessionClient|null} [sessionClient] - Session client override.
   * @param {GameClient|null} [gameClient] - Game client override, used for the access check.
   */
  constructor(setError, setFieldErrors = Noop.noop, sessionClient = null, gameClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.sessionClient = sessionClient ?? new GameSessionClient();
    this.gameClient = gameClient ?? new GameClient();
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
      const gameSlug = getGameSlugFromSessionNewHash(hash);
      const token = AuthStorage.getToken();

      this.gameClient.fetchGameAccess(gameSlug, token)
        .then((response) => (response.ok ? response.json() : { can_edit: false }))
        .then((access) => this.#redirectIfNotAllowed(access, gameSlug))
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

  #redirectIfNotAllowed(access, gameSlug) {
    if (!access.can_edit) {
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
