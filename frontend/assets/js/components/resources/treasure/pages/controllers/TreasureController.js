import TreasureClient from '../../../../../client/TreasureClient.js';
import BaseClient from '../../../../../client/BaseClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

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
      const hash = getCurrentHash();
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

    this.treasureClient.fetchTreasure(id, token)
      .then((response) => BaseClient.parseJsonOrReject(response, 'treasure failed'))
      .then((treasure) => this.#renderTreasure(id, treasure, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load treasure.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Render the treasure right away using AccessStore's synchronous,
   * fail-closed permissions reader, then re-render once the real
   * permissions resolve in the background so the page picks them up
   * without blocking the first render on the permissions fetch.
   *
   * @param {string|number} id - Treasure id.
   * @param {object} treasure - Base treasure data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  #renderTreasure(id, treasure, safeSet) {
    safeSet(this.setTreasure, this.#mergePermissions(id, treasure));

    AccessStore.ensureTreasurePermissions(id)
      .then(() => safeSet(this.setTreasure, this.#mergePermissions(id, treasure)));
  }

  #mergePermissions(id, treasure) {
    return { ...treasure, ...AccessStore.getTreasurePermissions(id) };
  }
}
