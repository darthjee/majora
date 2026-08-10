import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the source detail page. Unlike `TreasureController`, this fetches through
 * `RequestStore` alone with no `AccessStore` permission merge — `sources` has no per-item
 * edit concept (no write endpoint exists for `sources` at all).
 */
export default class SourceController extends BasePageController {
  /**
   * Extract the source id from the hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Source id.
   */
  static getSourceIdFromHash(hash = '') {
    return BasePageController.extractParam('/miniatures/sources/:source_id', 'source_id', hash);
  }

  /**
   * Create a source controller.
   *
   * @param {Function} setSource - Source setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   */
  constructor(setSource, setLoading, setError) {
    super();
    this.setSource = setSource;
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
      const id = SourceController.getSourceIdFromHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load source.');
        safeSet(this.setLoading, false);
      } else {
        RequestStore.ensure({
          componentName: 'SourceController', resource: 'source', quantityType: 'single', params: { id },
        })
          .then(({ data }) => safeSet(this.setSource, data))
          .catch(() => safeSet(this.setError, 'Unable to load source.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}
