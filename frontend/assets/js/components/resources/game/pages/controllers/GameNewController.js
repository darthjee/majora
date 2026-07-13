import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game creation page.
 */
export default class GameNewController extends BasePageController {
  /**
   * Create a game new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameClient|null} [gameClient] - Game client override.
   */
  constructor(setError, setFieldErrors = Noop.noop, gameClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks for an auth token and
   *   redirects to the register page when none is found.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const token = AuthStorage.getToken();

      if (!token) {
        if (typeof window !== 'undefined') {
          window.location.hash = '/users/register';
        }
      }
    };
  }

  /**
   * Submit the new game form.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a POST request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, description: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.hash = '/users/register';
      }
      return;
    }

    try {
      await this.#performCreate(token, formValues, setters);
    } catch {
      this.#handleNetworkError(setters);
    }
  }

  async #performCreate(token, formValues, setters) {
    const response = await this.gameClient.createGame(token, {
      name: formValues.name,
      description: formValues.description,
    });

    await this.#handleResponse(response, setters);
  }

  #handleNetworkError(setters) {
    setters.setStatus('error');
  }

  async #handleResponse(response, setters) {
    if (response.status === 201) {
      const data = await response.json();
      const gameSlug = data.game_slug;

      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}`;
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
