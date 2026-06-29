import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

/**
 * Controller for treasures index page.
 */
export default class TreasuresController extends BasePageController {
  /**
   * Create a treasures controller.
   *
   * @param {Function} setTreasures - Treasures setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setTreasures, setPagination, setLoading, setError, client = null) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      this.client.fetchIndex('/treasures.json')
        .then(({ data, pagination }) => {
          safeSet(this.setTreasures, Array.isArray(data) ? data : []);
          safeSet(this.setPagination, pagination);
        })
        .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
        .finally(() => safeSet(this.setLoading, false));

      return () => {
        mounted = false;
      };
    };
  }
}
