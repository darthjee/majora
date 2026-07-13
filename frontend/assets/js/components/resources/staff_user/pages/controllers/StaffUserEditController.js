import StaffUserClient from '../../../../../client/StaffUserClient.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import AccessStore from '../../../../../utils/AccessStore.js';
import BaseEditController from '../../../../common/controllers/BaseEditController.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the staff user edit page.
 */
export default class StaffUserEditController extends BaseEditController {
  /**
   * Extract user id from a staff user edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} User id.
   */
  static getStaffUserIdFromEditHash(hash = '') {
    return BasePageController.extractParam('/staff/users/:user_id/edit', 'user_id', hash);
  }

  /**
   * Create a staff user edit controller.
   *
   * @param {Function} setUser - User setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {StaffUserClient|null} [client] - Client override.
   */
  constructor(
    setUser, setLoading, setError, setFieldErrors = Noop.noop, client = null,
  ) {
    super(setUser, setLoading, setError, setFieldErrors);
    this.client = client ?? new StaffUserClient();
  }

  /**
   * Load the staff user to edit, gated on the current user being staff or a
   * superuser (redirects home otherwise).
   *
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @param {Function} isMounted - Returns whether the page is still mounted.
   * @returns {void}
   */
  loadResource(safeSet, isMounted) {
    AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
      if (!isMounted()) {
        return;
      }

      if (!isStaffOrSuperUser) {
        this.redirectTo('/');
        return;
      }

      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const id = StaffUserEditController.getStaffUserIdFromEditHash(hash);

      if (!id) {
        safeSet(this.setError, true);
        safeSet(this.setLoading, false);
        return;
      }

      const token = AuthStorage.getToken();

      this.fetchSingle(this.client.fetchUser(id, token), safeSet, true);
    });
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
  submitForm(event, id, formValues, setters) {
    const token = AuthStorage.getToken();

    return this.performSubmit(
      event,
      setters,
      () => this.client.updateUser(id, token, {
        name: formValues.name,
        email: formValues.email,
      }),
      `/staff/users/${id}`,
    );
  }
}
