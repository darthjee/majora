import AuthClient from '../../../client/AuthClient.js';
import StaffUserClient from '../../../client/StaffUserClient.js';
import AdminAccess from '../../../utils/AdminAccess.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import Noop from '../../../utils/Noop.js';

/**
 * Extract user id from a staff user edit hash.
 *
 * @param {string} hash - Current hash.
 * @returns {string} User id.
 */
export function getStaffUserIdFromEditHash(hash = '') {
  return Router.extractParams('/staff/users/:user_id/edit', hash).user_id ?? '';
}

/**
 * Controller for the staff user edit page.
 */
export default class StaffUserEditController extends BasePageController {
  /**
   * Create a staff user edit controller.
   *
   * @param {Function} setUser - User setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {StaffUserClient|null} [client] - Client override.
   * @param {AuthClient|null} [authClient] - Auth client override.
   */
  constructor(
    setUser, setLoading, setError, setFieldErrors = Noop.noop, client = null, authClient = null,
  ) {
    super();
    this.setUser = setUser;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.client = client ?? new StaffUserClient();
    this.authClient = authClient ?? new AuthClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects non-staff/non-superusers to the home page before
   *   fetching the user to edit.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AdminAccess.isStaffOrSuperUser(this.authClient).then((isStaffOrSuperUser) => {
        if (!mounted) {
          return;
        }

        if (!isStaffOrSuperUser) {
          if (typeof window !== 'undefined') {
            window.location.hash = '/';
          }
          return;
        }

        const hash = typeof window === 'undefined' ? '' : window.location.hash;
        const id = getStaffUserIdFromEditHash(hash);

        if (!id) {
          safeSet(this.setError, true);
          safeSet(this.setLoading, false);
        } else {
          this.#fetchUser(id, safeSet);
        }
      });

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Submit a partial update for the user's name and/or email.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string|number} id - User id.
   * @param {{name: string, email: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, id, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.client.updateUser(id, token, {
        name: formValues.name,
        email: formValues.email,
      });

      await this.#handleResponse(response, id, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #fetchUser(id, safeSet) {
    const token = AuthStorage.getToken();

    this.client.fetchUser(id, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('user failed'))))
      .then((user) => safeSet(this.setUser, user))
      .catch(() => safeSet(this.setError, true))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, id, setters) {
    if (response.ok) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/staff/users/${id}`;
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
