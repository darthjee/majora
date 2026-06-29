import TreasureClient from '../../../client/TreasureClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract treasure id from hash.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Treasure id.
 */
export function getTreasureIdFromHash(hash = '') {
  return Router.extractParams('/treasures/:treasure_id', hash).treasure_id ?? '';
}

/**
 * Controller for treasure detail page.
 */
export default class TreasureController extends BasePageController {
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
      const id = getTreasureIdFromHash(hash);

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
}
