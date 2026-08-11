import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BaseEditController from '../../../../common/base/controllers/BaseEditController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the STL model edit page. Mirrors `TreasureEditController`'s shape:
 * `stl_models` has no per-item edit concept in its payload, so the edit gate is the same global
 * staff-or-superuser check the create flow already uses (`require_staff` on the backend,
 * `AccessStore.ensureStaffOrSuperUser()` here), resolved once in `loadResource` before the
 * resource fetch even starts.
 */
export default class StlModelEditController extends BaseEditController {
  /**
   * Extract STL model id from a STL model edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} STL model id.
   */
  static getStlModelIdFromEditHash(hash = '') {
    return BasePageController.extractParam('/miniatures/stl_models/:id/edit', 'id', hash);
  }

  /**
   * Create a STL model edit controller.
   *
   * @param {Function} setStlModel - STL model setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   */
  constructor(setStlModel, setLoading, setError, setFieldErrors = Noop.noop) {
    super(setStlModel, setLoading, setError, setFieldErrors);
  }

  /**
   * Load the STL model, gated on the current user being staff or a superuser (redirects to the
   * STL models index otherwise).
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
        this.redirectTo('/miniatures/stl_models');
        return;
      }

      const hash = getCurrentHash();
      const id = StlModelEditController.getStlModelIdFromEditHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load STL model.');
        safeSet(this.setLoading, false);
        return;
      }

      const resourcePromise = RequestStore.ensure({
        componentName: 'StlModelEditController', resource: 'stlModel', quantityType: 'single', params: { id },
      });

      this.fetchSingleData(resourcePromise, safeSet, 'Unable to load STL model.');
    });
  }

  /**
   * Submit a partial update for the STL model.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request through {@link RequestStore.mutate} (so the STL model's cached `GET` data is
   *   purged on success), then redirects to the show page on success, sets field errors on 400,
   *   or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string|number} id - STL model id.
   * @param {{name: string, owned: boolean, type: string, race: string,
   *   role: string}} formValues - Raw form field values. `race`/`role` are converted from `''`
   *   (the `<select>`'s native blank-option value) to `null` here, matching the update
   *   endpoint's nullable field contract.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, id, formValues, setters) {
    return this.performSubmit(
      event,
      setters,
      () => RequestStore.mutate({
        componentName: 'StlModelEditController',
        resource: 'stlModel',
        method: 'PATCH',
        quantityType: 'single',
        params: { id },
        body: {
          name: formValues.name,
          owned: formValues.owned,
          type: formValues.type,
          race: formValues.race || null,
          role: formValues.role || null,
        },
      }),
      `/miniatures/stl_models/${id}`,
    );
  }
}
