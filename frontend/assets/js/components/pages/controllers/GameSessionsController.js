import GameClient from '../../../client/GameClient.js';
import GenericClient from '../../../client/GenericClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug from a sessions index hash.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromSessionsHash(hash = '') {
  return Router.extractParams('/games/:game_slug/sessions', hash).game_slug ?? '';
}

/**
 * Controller for game sessions index page.
 */
export default class GameSessionsController extends BasePageController {
  /**
   * Create a game sessions controller.
   *
   * @param {Function} setSessions - Sessions setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [setCanEdit] - Can-edit flag setter, gates the "New session" button.
   * @param {GameClient|null} [gameClient] - Game client override, used for the access check.
   */
  constructor(
    setSessions,
    setPagination,
    setLoading,
    setError,
    client = null,
    setCanEdit = () => {},
    gameClient = null,
  ) {
    super();
    this.setSessions = setSessions;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setCanEdit = setCanEdit;
    this.gameClient = gameClient ?? new GameClient();
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
      const gameSlug = getGameSlugFromSessionsHash(this.client.currentHash());

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
    const token = AuthStorage.getToken();

    this.gameClient.fetchGameAccess(gameSlug, token)
      .then((response) => (response.ok ? response.json() : { can_edit: false }))
      .then((access) => safeSet(this.setCanEdit, Boolean(access.can_edit)))
      .catch(() => safeSet(this.setCanEdit, false));
  }
}
