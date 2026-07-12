import TreasureClient from '../../../client/TreasureClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import AccessStore from '../../../utils/AccessStore.js';
import BasePageController from './BasePageController.js';

/**
 * Controller for treasure detail page.
 */
export default class TreasureController extends BasePageController {
  /**
   * Extract treasure id from hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Treasure id.
   */
  static getTreasureIdFromHash(hash = '') {
    return BasePageController.extractParam('/treasures/:treasure_id', 'treasure_id', hash);
  }

  /**
   * Create a treasure controller.
   *
   * @param {Function} setTreasure - Treasure setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {TreasureClient|null} [treasureClient] - Client override.
   */
  constructor(setTreasure, setLoading, setError, treasureClient = null) {
    super();
    this.setTreasure = setTreasure;
    this.setLoading = setLoading;
    this.setError = setError;
    this.treasureClient = treasureClient ?? new TreasureClient();
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
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const id = TreasureController.getTreasureIdFromHash(hash);

      if (!id) {
        safeSet(this.setError, 'Unable to load treasure.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchTreasureWithAccess(id, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchTreasureWithAccess(id, safeSet) {
    const token = AuthStorage.getToken();

    Promise.all([
      this.treasureClient.fetchTreasure(id, token).then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('treasure failed')))),
      AccessStore.ensureTreasurePermissions(id),
    ])
      .then(([treasure, permissions]) => safeSet(this.setTreasure, { ...treasure, ...permissions }))
      .catch(() => safeSet(this.setError, 'Unable to load treasure.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
