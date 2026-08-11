import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the collection detail page. Unlike `TreasureController`, this fetches through
 * `RequestStore` alone with no `AccessStore` permission merge — `collections` has no per-item
 * edit concept (no write endpoint exists for `collections` at all), mirroring `SourceController`.
 */
export default class CollectionController extends BasePageController {
  /**
   * Extract the collection id from the hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Collection id.
   */
  static getCollectionIdFromHash(hash = '') {
    return BasePageController.extractParam('/miniatures/collections/:collection_id', 'collection_id', hash);
  }

  /**
   * Create a collection controller.
   *
   * @param {Function} setCollection - Collection setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   */
  constructor(setCollection, setLoading, setError) {
    super();
    this.setCollection = setCollection;
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
      const id = CollectionController.getCollectionIdFromHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load collection.');
        safeSet(this.setLoading, false);
      } else {
        RequestStore.ensure({
          componentName: 'CollectionController', resource: 'collection', quantityType: 'single', params: { id },
        })
          .then(({ data }) => safeSet(this.setCollection, data))
          .catch(() => safeSet(this.setError, 'Unable to load collection.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}
