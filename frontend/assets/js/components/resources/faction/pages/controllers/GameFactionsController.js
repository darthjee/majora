import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game factions index page's "Create Faction" gating (issue #812).
 *
 * @description Resolves `can_create_faction` via `AccessStore.ensureGamePermissions`,
 *   independent of `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the
 *   plain `can_edit` permission (dm/admin only) and would wrongly hide the "Create Faction" link
 *   from staff/players, mirroring `GameItemsController`'s own, independent
 *   `AccessStore.ensureGamePermissions`-backed `canCreateItem` derivation for the same reason.
 */
export default class GameFactionsController extends BasePageController {
  /**
   * Extract the game slug from a game factions index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromFactionsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/factions', 'game_slug', hash);
  }

  /**
   * Create a game factions controller.
   *
   * @param {Function} setCanCreateFaction - Setter for whether the requester may create a new
   *   faction.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setCanCreateFaction, client = new GenericClient()) {
    super();
    this.setCanCreateFaction = setCanCreateFaction;
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
      const gameSlug = GameFactionsController.getGameSlugFromFactionsHash(this.client.currentHash());

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => Boolean(permissions.can_create_faction))
        .catch(() => false)
        .then((canCreateFaction) => safeSet(this.setCanCreateFaction, canCreateFaction));

      return () => {
        mounted = false;
      };
    };
  }
}
