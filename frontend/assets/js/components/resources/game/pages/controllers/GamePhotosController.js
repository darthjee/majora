import GenericClient from '../../../../../client/GenericClient.js';
import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Controller for the game photos index page.
 */
export default class GamePhotosController extends BasePageController {
  /**
   * Extract game slug from the game photos hash route.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromPhotosHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/photos', 'game_slug', hash);
  }

  /**
   * Create a game photos controller.
   *
   * @param {Function} setPhotos - Photos setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setGame - Game setter, merged with can_edit for the upload button gate.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {GameClient|null} gameClient - Game client override.
   */
  constructor(setPhotos, setPagination, setGame, setLoading, setError, client = null, gameClient = null) {
    super();
    this.setPhotos = setPhotos;
    this.setPagination = setPagination;
    this.setGame = setGame;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
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
      const gameSlug = GamePhotosController.getGameSlugFromPhotosHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load photos.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchPhotos(gameSlug, safeSet);
        this.#fetchGame(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchPhotos(gameSlug, safeSet) {
    this.client.fetchIndex(`/games/${gameSlug}/photos.json`)
      .then(({ data, pagination }) => {
        safeSet(this.setPhotos, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load photos.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchGame(gameSlug, safeSet) {
    const token = AuthStorage.getToken();

    this.gameClient.fetchGame(gameSlug, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((game) => this.#mergeAccess(gameSlug, game, safeSet))
      .catch(() => safeSet(this.setGame, { can_edit: false }));
  }

  #mergeAccess(gameSlug, game, safeSet) {
    if (!game) {
      safeSet(this.setGame, { can_edit: false });
      return Promise.resolve();
    }

    return AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => safeSet(this.setGame, { ...game, ...permissions }))
      .catch(() => safeSet(this.setGame, { ...game, can_edit: false }));
  }
}
