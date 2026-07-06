import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

/**
 * Controller for game PCs page.
 */
export default class GamePcsController extends BasePageController {
  /**
   * Extract game slug from PCs hash route.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromPcsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/pcs', 'game_slug', hash);
  }

  /**
   * Create a game PCs controller.
   *
   * @param {Function} setPcs - PCs setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setPcs, setPagination, setLoading, setError, client = null) {
    super();
    this.setPcs = setPcs;
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
      const gameSlug = GamePcsController.getGameSlugFromPcsHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load PCs.');
        safeSet(this.setLoading, false);
      } else {
        this.client.fetchIndex(`/games/${gameSlug}/pcs.json`)
          .then(({ data, pagination }) => {
            safeSet(this.setPcs, Array.isArray(data) ? data : []);
            safeSet(this.setPagination, pagination);
          })
          .catch(() => safeSet(this.setError, 'Unable to load PCs.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}
