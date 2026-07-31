import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BaseEditController from '../../../../common/base/controllers/BaseEditController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

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
   */
  constructor(setTreasure, setLoading, setError, setFieldErrors = Noop.noop) {
    super(setTreasure, setLoading, setError, setFieldErrors);
  }

  /**
   * Load the treasure and its access permissions, gated on the current user
   * being staff or a superuser (redirects home otherwise).
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

      const hash = getCurrentHash();
      const id = TreasureEditController.getTreasureIdFromEditHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load treasure.');
        safeSet(this.setLoading, false);
        return;
      }

      const resourcePromise = RequestStore.ensure({
        componentName: 'TreasureEditController', resource: 'treasure', quantityType: 'single', params: { id },
      });

      // The permissions fetch must wait for the resource fetch to resolve: which
      // route to call (global vs. game-exclusive) depends on the treasure's own
      // `game_slug`, only known once its detail data has loaded (see TreasureClient
      // #fetchTreasurePermissions).
      const permissionsPromise = resourcePromise
        .then(({ data }) => AccessStore.ensureTreasurePermissions(id, Boolean(data.game_slug)));

      this.fetchDataWithAccess(resourcePromise, permissionsPromise, safeSet, 'Unable to load treasure.');
    });
  }

  /**
   * Submit a partial update for the treasure.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request through {@link RequestStore.mutate} (issue #841, so the treasure's cached
   *   `GET` data is purged on success), then redirects on success, sets field errors on 400, or
   *   sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string|number} id - Treasure id.
   * @param {{name: string, value: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, id, formValues, setters) {
    return this.performSubmit(
      event,
      setters,
      () => RequestStore.mutate({
        componentName: 'TreasureEditController',
        resource: 'treasure',
        method: 'PATCH',
        quantityType: 'single',
        params: { id },
        body: {
          name: formValues.name,
          value: parseInt(formValues.value, 10),
        },
      }),
      `/treasures/${id}`,
    );
  }
}
