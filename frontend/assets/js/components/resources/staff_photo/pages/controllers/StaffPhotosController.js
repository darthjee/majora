import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import StaffPhotoTypes from '../helpers/StaffPhotoTypes.js';
import staffPhotoErrorKey from '../helpers/StaffPhotoErrors.js';

const COMPONENT_NAME = 'StaffPhotosController';
const RESOURCE = 'staffPhoto';
const LOAD_ERROR_KEY = 'staff_photos_page.error';

/**
 * Controller for the staff photos page (issue #1473).
 *
 * @description Loads the available photo types, resolves the active type from the hash `type`
 *   param, lists that type's photos (paginated) and runs the per-row Delete action plus the
 *   Replace success/error bookkeeping. Every state update goes through a safe setter so updates
 *   landing after unmount are ignored. Error state holds i18n keys, translated at render time.
 */
export default class StaffPhotosController extends BasePageController {
  /**
   * Create a staff photos controller.
   *
   * @param {object} setters - React state setters.
   * @param {Function} setters.setTypes - Available photo types setter.
   * @param {Function} setters.setMaxDimension - Max photo dimension setter.
   * @param {Function} setters.setPhotoType - Active photo type setter.
   * @param {Function} setters.setPhotos - Photo rows setter.
   * @param {Function} setters.setPagination - Pagination setter.
   * @param {Function} setters.setLoading - Loading flag setter.
   * @param {Function} setters.setError - Load error (i18n key) setter.
   * @param {Function} setters.setActionError - Row action error (i18n key) setter.
   * @param {Function} setters.setVersions - Photo id to cache-busting version map setter.
   */
  constructor(setters) {
    super();
    Object.assign(this, setters);
    this.photoType = null;
    this.versions = {};
    this.mounted = false;
    this.safeSet = this.buildSafeSetter(() => this.mounted);
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects non-staff/non-superusers to the home page; otherwise loads the photo
   *   types index, resolves the active type and fetches its photo list.
   * @returns {Function} Effect callback, returning its cleanup.
   */
  buildEffect() {
    return () => {
      this.mounted = true;

      AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
        if (!this.mounted) return;

        if (!isStaffOrSuperUser) {
          this.redirectTo('/');
          return;
        }

        this.#fetchIndex();
      });

      return () => {
        this.mounted = false;
      };
    };
  }

  /**
   * Fetch the photo list of the active type.
   *
   * @description Sends only the hash pagination params as the query; the photo type travels in
   *   the path.
   * @returns {Promise<void>} Resolves when the list has been stored (or the error recorded).
   */
  fetchList() {
    const query = Object.fromEntries(new HashRouteResolver().getPaginationParams());

    return RequestStore.ensure({
      componentName: COMPONENT_NAME,
      resource: RESOURCE,
      quantityType: 'collection',
      params: { photoType: this.photoType },
      query,
    })
      .then(({ data, pagination }) => {
        this.safeSet(this.setPhotos, Array.isArray(data) ? data : []);
        this.safeSet(this.setPagination, pagination);
      })
      .catch(() => this.safeSet(this.setError, LOAD_ERROR_KEY))
      .finally(() => this.safeSet(this.setLoading, false));
  }

  /**
   * Delete a photo through {@link RequestStore.mutate}.
   *
   * @description On success the list cache is purged by `mutate` and the list is refetched. On
   *   failure the status is mapped to an error key (a 404 also purges and refetches); network
   *   errors map to the generic error.
   * @param {{id: number}} photo - The photo row to delete.
   * @returns {Promise<void>} Resolves when the action finishes.
   */
  async handleDelete(photo) {
    this.safeSet(this.setActionError, null);

    try {
      const response = await RequestStore.mutate({
        componentName: COMPONENT_NAME,
        resource: RESOURCE,
        method: 'DELETE',
        quantityType: 'single',
        params: { photoType: this.photoType, id: photo.id },
        variantName: 'regular',
      });

      if (response.ok) {
        await this.fetchList();
        return;
      }

      await this.#handleFailure('delete', response.status);
    } catch {
      this.safeSet(this.setActionError, staffPhotoErrorKey('delete'));
    }
  }

  /**
   * Handle a successful photo replace.
   *
   * @description Purges the cached lists, records a cache-busting version for the photo's
   *   thumbnail and refetches the list.
   * @param {{id: number}} photo - The replaced photo row.
   * @returns {Promise<void>} Resolves when the list has been refetched.
   */
  handleReplaceSuccess(photo) {
    RequestStore.purge({ resource: RESOURCE });
    this.versions = { ...this.versions, [photo.id]: Date.now() };
    this.safeSet(this.setActionError, null);
    this.safeSet(this.setVersions, this.versions);

    return this.fetchList();
  }

  /**
   * Handle a failed photo replace.
   *
   * @param {{id: number}} _photo - The photo row whose replace failed.
   * @param {number|undefined} status - HTTP status of the failed response.
   * @returns {Promise<void>} Resolves once the error is recorded (and, on 404, the list
   *   refetched).
   */
  handleReplaceError(_photo, status) {
    return this.#handleFailure('replace', status);
  }

  /**
   * Build the staff replace (upload init) path of a photo of the active type.
   *
   * @param {{id: number}} photo - The photo row.
   * @returns {string} The replace endpoint path.
   */
  replacePath(photo) {
    return `/staff/photos/${this.photoType}/${photo.id}/replace.json`;
  }

  #handleFailure(action, status) {
    this.safeSet(this.setActionError, staffPhotoErrorKey(action, status));

    if (status !== 404) return Promise.resolve();

    RequestStore.purge({ resource: RESOURCE });
    return this.fetchList();
  }

  #fetchIndex() {
    RequestStore.ensure({ componentName: COMPONENT_NAME, resource: RESOURCE, quantityType: 'index' })
      .then(({ data }) => this.#applyIndex(data ?? {}))
      .catch(() => {
        this.safeSet(this.setError, LOAD_ERROR_KEY);
        this.safeSet(this.setLoading, false);
      });
  }

  #applyIndex({ types = [], max_dimension: maxDimension = null }) {
    const requested = new HashRouteResolver().getFilterParams().get('type');

    this.photoType = StaffPhotoTypes.resolveType(types, requested);
    this.safeSet(this.setTypes, types);
    this.safeSet(this.setMaxDimension, maxDimension);
    this.safeSet(this.setPhotoType, this.photoType);

    if (!this.photoType) {
      this.safeSet(this.setLoading, false);
      return null;
    }

    return this.fetchList();
  }
}
