import GenericClient from '../../../../../client/GenericClient.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Controller for games index page.
 */
export default class GamesController extends BasePageController {
  /**
   * Create a games controller.
   *
   * @param {Function} setGames - Games setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setGames, setPagination, setLoading, setError, client = null) {
    super();
    this.setGames = setGames;
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

      this.client.fetchIndex('/games.json')
        .then(({ data, pagination }) => {
          safeSet(this.setGames, Array.isArray(data) ? data : []);
          safeSet(this.setPagination, pagination);
        })
        .catch(() => safeSet(this.setError, 'Unable to load games.'))
        .finally(() => safeSet(this.setLoading, false));

      return () => {
        mounted = false;
      };
    };
  }
}
