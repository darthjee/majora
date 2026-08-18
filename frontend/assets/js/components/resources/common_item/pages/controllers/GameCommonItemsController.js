import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game common items index page's "Create Common Item" gating (issue #826),
 * mirroring `GamePossessionsController`.
 *
 * @description Resolves `can_create_common_item` via `AccessStore.ensureGamePermissions`,
 *   independent of `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the
 *   plain `can_edit` permission (dm/admin only) and would wrongly hide the "Create Common Item"
 *   link from staff/players.
 */
export default class GameCommonItemsController extends BasePageController {
  /**
   * Extract the game slug from a game common items index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromCommonItemsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/common_items', 'game_slug', hash);
  }

  /**
   * Create a game common items controller.
   *
   * @param {Function} setCanCreateCommonItem - Setter for whether the requester may create a new
   *   common item.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setCanCreateCommonItem, client = new GenericClient()) {
    super();
    this.setCanCreateCommonItem = setCanCreateCommonItem;
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
      const gameSlug = GameCommonItemsController.getGameSlugFromCommonItemsHash(this.client.currentHash());

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => Boolean(permissions.can_create_common_item))
        .catch(() => false)
        .then((canCreateCommonItem) => safeSet(this.setCanCreateCommonItem, canCreateCommonItem));

      return () => {
        mounted = false;
      };
    };
  }
}
