import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug from NPCs hash route.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromNpcsHash(hash = '') {
  return Router.extractParams('/games/:game_slug/npcs', hash).game_slug ?? '';
}

/**
 * Controller for game NPCs page.
 */
export default class GameNpcsController extends BasePageController {
  /**
   * Create a game NPCs controller.
   *
   * @param {Function} setNpcs - NPCs setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setNpcs, setPagination, setLoading, setError, client = null) {
    super();
    this.setNpcs = setNpcs;
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
      const gameSlug = getGameSlugFromNpcsHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load NPCs.');
        safeSet(this.setLoading, false);
      } else {
        this.client.fetchIndex(`/games/${gameSlug}/npcs.json`)
          .then(({ data, pagination }) => {
            safeSet(this.setNpcs, Array.isArray(data) ? data : []);
            safeSet(this.setPagination, pagination);
          })
          .catch(() => safeSet(this.setError, 'Unable to load NPCs.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}
