import TreasureClient from '../../../../../client/TreasureClient.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import AccessStore from '../../../../../utils/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the treasure creation page.
 */
export default class TreasureNewController extends BasePageController {
  /**
   * Create a treasure new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   */
  constructor(setError, setFieldErrors = Noop.noop, treasureClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.treasureClient = treasureClient ?? new TreasureClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user is
   *   a superuser and redirects to the home page when they are not.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      AccessStore.ensureSuperUser().then((isSuperUser) => {
        if (!isSuperUser) {
          if (typeof window !== 'undefined') {
            window.location.hash = '/';
          }
        }
      });
    };
  }

  /**
   * Submit the new treasure form.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a POST request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, value: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const isSuperUser = await AccessStore.ensureSuperUser();

    if (!isSuperUser) {
      if (typeof window !== 'undefined') {
        window.location.hash = '/';
      }
      return;
    }

    const token = AuthStorage.getToken();

    try {
      await this.#performCreate(token, formValues, setters);
    } catch {
      this.#handleNetworkError(setters);
    }
  }

  async #performCreate(token, formValues, setters) {
    const response = await this.treasureClient.createTreasure(token, {
      name: formValues.name,
      value: parseInt(formValues.value, 10),
    });

    await this.#handleResponse(response, setters);
  }

  #handleNetworkError(setters) {
    setters.setStatus('error');
  }

  async #handleResponse(response, setters) {
    if (response.status === 201) {
      const data = await response.json();
      const treasureId = data.id;

      if (typeof window !== 'undefined') {
        window.location.hash = `/treasures/${treasureId}`;
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
