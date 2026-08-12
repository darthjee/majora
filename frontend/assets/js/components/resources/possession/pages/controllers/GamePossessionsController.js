import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game possessions index page's "Create Possession" gating (issue #1074),
 * mirroring `GameItemsController`.
 *
 * @description Resolves `can_create_possession` via `AccessStore.ensureGamePermissions`,
 *   independent of `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the
 *   plain `can_edit` permission (dm/admin only) and would wrongly hide the "Create Possession"
 *   link from staff/players.
 */
export default class GamePossessionsController extends BasePageController {
  /**
   * Extract the game slug from a game possessions index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromPossessionsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/possessions', 'game_slug', hash);
  }

  /**
   * Create a game possessions controller.
   *
   * @param {Function} setCanCreatePossession - Setter for whether the requester may create a new
   *   possession.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setCanCreatePossession, client = new GenericClient()) {
    super();
    this.setCanCreatePossession = setCanCreatePossession;
    this.client = client;
  }

  /**
   * Build the page mount effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const gameSlug = GamePossessionsController.getGameSlugFromPossessionsHash(this.client.currentHash());

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => Boolean(permissions.can_create_possession))
        .catch(() => false)
        .then((canCreatePossession) => safeSet(this.setCanCreatePossession, canCreatePossession));

      return () => {
        mounted = false;
      };
    };
  }
}
