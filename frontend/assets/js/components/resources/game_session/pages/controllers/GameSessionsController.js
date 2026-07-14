import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for game sessions index page.
 */
export default class GameSessionsController extends BasePageController {
  /**
   * Extract game slug from a sessions index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromSessionsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/sessions', 'game_slug', hash);
  }

  /**
   * Create a game sessions controller.
   *
   * @param {Function} setSessions - Sessions setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [setCanEdit] - Can-edit flag setter, gates the "New session" button.
   */
  constructor(
    setSessions,
    setPagination,
    setLoading,
    setError,
    client = null,
    setCanEdit = Noop.noop,
  ) {
    super();
    this.setSessions = setSessions;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setCanEdit = setCanEdit;
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
      const gameSlug = GameSessionsController.getGameSlugFromSessionsHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load sessions.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchAccess(gameSlug, safeSet);
        this.#fetchSessions(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchSessions(gameSlug, safeSet) {
    this.client.fetchIndex(`/games/${gameSlug}/sessions.json`)
      .then(({ data, pagination }) => {
        safeSet(this.setSessions, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load sessions.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchAccess(gameSlug, safeSet) {
    AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => safeSet(this.setCanEdit, Boolean(permissions.can_edit)))
      .catch(() => safeSet(this.setCanEdit, false));
  }
}
