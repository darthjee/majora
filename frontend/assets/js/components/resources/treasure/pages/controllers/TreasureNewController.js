import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
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
   */
  constructor(setError, setFieldErrors = Noop.noop) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user is
   *   staff or a superuser and redirects to the home page when they are not.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
        if (!isStaffOrSuperUser) {
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
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (issue #841, so the treasure collection's
   *   cached `GET` data is purged on success), then redirects on success, sets field errors on
   *   400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, value: string, gameType: string}} formValues - Raw form field
   *   values. `gameType` is the selected currency model name (`dnd` or `deadlands`).
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const isStaffOrSuperUser = await AccessStore.ensureStaffOrSuperUser();

    if (!isStaffOrSuperUser) {
      if (typeof window !== 'undefined') {
        window.location.hash = '/';
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
      componentName: 'TreasureNewController',
      resource: 'treasure',
      method: 'POST',
      quantityType: 'collection',
      params: {},
      body: {
        name: formValues.name,
        value: parseInt(formValues.value, 10),
        game_type: formValues.gameType,
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
