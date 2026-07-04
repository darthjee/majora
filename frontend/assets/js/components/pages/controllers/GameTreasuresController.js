import AuthClient from '../../../client/AuthClient.js';
import GenericClient from '../../../client/GenericClient.js';
import AdminAccess from '../../../utils/AdminAccess.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug from treasures hash route.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromTreasuresHash(hash = '') {
  return Router.extractParams('/games/:game_slug/treasures', hash).game_slug ?? '';
}

/**
 * Controller for game treasures page.
 */
export default class GameTreasuresController extends BasePageController {
  /**
   * Create a game treasures controller.
   *
   * @param {Function} setTreasures - Treasures setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [setIsSuperUser] - Superuser flag setter, used to gate the
   *   per-treasure upload button — this page has no superuser-only redirect,
   *   unlike TreasuresController, since it is public.
   * @param {AuthClient|null} authClient - Auth client override.
   */
  constructor(
    setTreasures,
    setPagination,
    setLoading,
    setError,
    client = null,
    setIsSuperUser = () => {},
    authClient = null,
  ) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setIsSuperUser = setIsSuperUser;
    this.authClient = authClient ?? new AuthClient();
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
      const gameSlug = getGameSlugFromTreasuresHash(this.client.currentHash());

      AdminAccess.isSuperUser(this.authClient).then((isSuperUser) => {
        safeSet(this.setIsSuperUser, isSuperUser);
      });

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load treasures.');
        safeSet(this.setLoading, false);
      } else {
        this.client.fetchIndex(`/games/${gameSlug}/treasures.json`)
          .then(({ data, pagination }) => {
            safeSet(this.setTreasures, Array.isArray(data) ? data : []);
            safeSet(this.setPagination, pagination);
          })
          .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}
