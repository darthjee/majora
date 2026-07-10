import TreasureClient from '../../../client/TreasureClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import AccessStore from '../../../utils/AccessStore.js';
import BaseEditController from './BaseEditController.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Controller for the treasure edit page.
 */
export default class TreasureEditController extends BaseEditController {
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
   */
  constructor(
    setTreasure, setLoading, setError, setFieldErrors = Noop.noop, treasureClient = null,
  ) {
    super(setTreasure, setLoading, setError, setFieldErrors);
    this.treasureClient = treasureClient ?? new TreasureClient();
  }

  /**
   * Load the treasure and its access permissions, gated on the current user
   * being a superuser (redirects home otherwise).
   *
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @param {Function} isMounted - Returns whether the page is still mounted.
   * @returns {void}
   */
  loadResource(safeSet, isMounted) {
    AccessStore.ensureSuperUser().then((isSuperUser) => {
      if (!isMounted()) {
        return;
      }

      if (!isSuperUser) {
        this.redirectTo('/');
        return;
      }

      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const id = TreasureEditController.getTreasureIdFromEditHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load treasure.');
        safeSet(this.setLoading, false);
        return;
      }

      const token = AuthStorage.getToken();

      this.fetchWithAccess(
        this.treasureClient.fetchTreasure(id, token),
        AccessStore.ensureTreasureAccess(id),
        safeSet,
        'Unable to load treasure.',
      );
    });
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
  submitForm(event, id, formValues, setters) {
    const token = AuthStorage.getToken();

    return this.performSubmit(
      event,
      setters,
      () => this.treasureClient.updateTreasure(id, token, {
        name: formValues.name,
        value: parseInt(formValues.value, 10),
      }),
      `/treasures/${id}`,
    );
  }
}
