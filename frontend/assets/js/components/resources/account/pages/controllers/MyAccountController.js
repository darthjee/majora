import AuthClient from '../../../../../client/AuthClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Controller for the my account page.
 */
export default class MyAccountController extends BasePageController {
  /**
   * Create a my account controller.
   *
   * @param {Function} setName - Name setter, used to prefill the form.
   * @param {Function} setFirstName - First name setter, used to prefill the form.
   * @param {Function} setLastName - Last name setter, used to prefill the form.
   * @param {Function} setEmail - Email setter, used to prefill the form.
   * @param {Function} setAvatarUrl - Avatar URL setter, used to prefill the page avatar.
   * @param {Function} setLoading - Loading setter.
   * @param {AuthClient|null} [client] - Client override.
   */
  constructor(setName, setFirstName, setLastName, setEmail, setAvatarUrl, setLoading, client = null) {
    super();
    this.setName = setName;
    this.setFirstName = setFirstName;
    this.setLastName = setLastName;
    this.setEmail = setEmail;
    this.setAvatarUrl = setAvatarUrl;
    this.setLoading = setLoading;
    this.client = client ?? new AuthClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Fetches the authenticated user's own account and prefills
   *   the name/email fields, redirecting to the home page on `401` or any
   *   other failure.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      this.#fetchAccount(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Submit an update for the account's name, email and, optionally, password.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then sets a success status on
   *   success, field errors on `400`, or an error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, firstName: string, lastName: string, email: string,
   *   password: string, passwordConfirmation: string}} formValues - Raw form field values.
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

    try {
      const response = await this.client.updateAccount(token, formValues);

      await this.#handleResponse(response, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #fetchAccount(safeSet) {
    const token = AuthStorage.getToken();

    this.client.fetchAccount(token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('account fetch failed'))))
      .then((account) => {
        safeSet(this.setName, account.name ?? '');
        safeSet(this.setFirstName, account.first_name ?? '');
        safeSet(this.setLastName, account.last_name ?? '');
        safeSet(this.setEmail, account.email ?? '');
        safeSet(this.setAvatarUrl, account.avatar_url ?? null);
      })
      .catch(() => this.#redirectHome())
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, setters) {
    if (!response.ok) {
      await this.#handleFailure(response, setters);
      return;
    }

    setters.setStatus('success');
  }

  async #handleFailure(response, setters) {
    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setStatus('error');
  }

  #redirectHome() {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.hash = '/';
  }
}
