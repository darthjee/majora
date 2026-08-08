import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the STL model detail page. Unlike `TreasureController`, this fetches through
 * `RequestStore` alone with no `AccessStore` permission merge — `stl_models` has no per-item
 * edit concept (no write endpoint exists for `stl_models` at all).
 */
export default class StlModelController extends BasePageController {
  /**
   * Extract the STL model id from the hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} STL model id.
   */
  static getStlModelIdFromHash(hash = '') {
    return BasePageController.extractParam('/stl_models/:stl_model_id', 'stl_model_id', hash);
  }

  /**
   * Create a STL model controller.
   *
   * @param {Function} setStlModel - STL model setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   */
  constructor(setStlModel, setLoading, setError) {
    super();
    this.setStlModel = setStlModel;
    this.setLoading = setLoading;
    this.setError = setError;
  }

  /**
   * Build the page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = getCurrentHash();
      const id = StlModelController.getStlModelIdFromHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load STL model.');
        safeSet(this.setLoading, false);
      } else {
        RequestStore.ensure({
          componentName: 'StlModelController', resource: 'stlModel', quantityType: 'single', params: { id },
        })
          .then(({ data }) => safeSet(this.setStlModel, data))
          .catch(() => safeSet(this.setError, 'Unable to load STL model.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}
