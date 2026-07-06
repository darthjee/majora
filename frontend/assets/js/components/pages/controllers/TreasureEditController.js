import AuthClient from '../../../client/AuthClient.js';
import TreasureClient from '../../../client/TreasureClient.js';
import AdminAccess from '../../../utils/AdminAccess.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Controller for the treasure edit page.
 */
export default class TreasureEditController extends BasePageController {
  /**
   * Extract treasure id from a treasure edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Treasure id.
   */
  static getTreasureIdFromEditHash(hash = '') {
    return BasePageController.extractParam('/treasures/:treasure_id/edit', 'treasure_id', hash);
  }

  /**
   * Create a treasure edit controller.
   *
   * @param {Function} setTreasure - Treasure setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   * @param {AuthClient|null} [authClient] - Auth client override.
   */
  constructor(
    setTreasure, setLoading, setError, setFieldErrors = Noop.noop, treasureClient = null, authClient = null,
  ) {
    super();
    this.setTreasure = setTreasure;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.treasureClient = treasureClient ?? new TreasureClient();
    this.authClient = authClient ?? new AuthClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects non-superusers to the home page before fetching
   *   the treasure and its access.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AdminAccess.isSuperUser(this.authClient).then((isSuperUser) => {
        if (!mounted) {
          return;
        }

        if (!isSuperUser) {
          if (typeof window !== 'undefined') {
            window.location.hash = '/';
          }
          return;
        }

        const hash = typeof window === 'undefined' ? '' : window.location.hash;
        const id = TreasureEditController.getTreasureIdFromEditHash(hash);

        if (!id) {
          safeSet(this.setError, 'Unable to load treasure.');
          safeSet(this.setLoading, false);
        } else {
          this.#fetchTreasureWithAccess(id, safeSet);
        }
      });

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Submit a partial update for the treasure.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string|number} id - Treasure id.
   * @param {{name: string, value: string}} formValues - Raw form field values.
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
      const response = await this.treasureClient.updateTreasure(id, token, {
        name: formValues.name,
        value: parseInt(formValues.value, 10),
      });

      await this.#handleResponse(response, id, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #fetchTreasureWithAccess(id, safeSet) {
    const token = AuthStorage.getToken();

    Promise.all([
      this.treasureClient.fetchTreasure(id, token),
      this.treasureClient.fetchTreasureAccess(id, token),
    ])
      .then(([treasureResponse, accessResponse]) => Promise.all([
        treasureResponse.ok
          ? treasureResponse.json()
          : Promise.reject(new Error('treasure failed')),
        accessResponse.ok
          ? accessResponse.json()
          : Promise.resolve({ can_edit: false }),
      ]))
      .then(([treasure, access]) => safeSet(this.setTreasure, { ...treasure, ...access }))
      .catch(() => safeSet(this.setError, 'Unable to load treasure.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, id, setters) {
    if (response.ok) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/treasures/${id}`;
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
