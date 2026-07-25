import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

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
   */
  constructor(setError, setFieldErrors = Noop.noop) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
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
      const hash = getCurrentHash();
      const gameSlug = GameSessionNewController.getGameSlugFromSessionNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToSessions(gameSlug));
    };
  }

  /**
   * Submit the new session form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (issue #842, so the session collection's
   *   cached `GET` data is purged on success), then redirects on success, sets field errors on
   *   400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{title: string, date: string, description: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'GameSessionNewController',
        resource: 'session',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug },
        body: {
          title: formValues.title,
          date: formValues.date || null,
          description: formValues.description || null,
        },
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
