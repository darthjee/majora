import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
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
   */
  constructor(setError, setFieldErrors = Noop.noop) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
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
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (issue #844, so the game collection's
   *   cached `GET` data is purged on success), then redirects on success, sets field errors on
   *   400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, description: string,
   *   game_type: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    if (!AuthStorage.getToken()) {
      if (typeof window !== 'undefined') {
        window.location.hash = '/users/register';
      }
      return;
    }

    try {
      await this.#performCreate(formValues, setters);
    } catch {
      this.#handleNetworkError(setters);
    }
  }

  async #performCreate(formValues, setters) {
    const response = await RequestStore.mutate({
      componentName: 'GameNewController',
      resource: 'game',
      method: 'POST',
      quantityType: 'collection',
      params: {},
      body: {
        name: formValues.name,
        description: formValues.description,
        game_type: formValues.game_type,
      },
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
