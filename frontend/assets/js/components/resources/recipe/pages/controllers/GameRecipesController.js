import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import buildFilteredHref from '../../../../../utils/routing/buildFilteredHref.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game recipes index page's "New Recipe" gating (issue #1449), mirroring
 * `GameCommonItemsController`.
 *
 * @description Resolves `can_create_recipe` (carried by the game permissions payload) via
 *   `AccessStore.ensureGamePermissions`, independent of `ListPage`'s built-in `canEdit` — the
 *   latter reflects the plain `can_edit` permission and would wrongly hide the "New" link from
 *   other roles allowed to create recipes.
 */
export default class GameRecipesController extends BasePageController {
  /**
   * Extract the game slug from a game recipes index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromRecipesHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/recipes', 'game_slug', hash);
  }

  /**
   * Build the hash URL applying recipe filters, resetting pagination to page 1.
   *
   * @param {string} basePath - Base hash path of the recipes index (e.g. `#/games/demo/recipes`).
   * @param {{category?: string}} filters - Filters to apply, as built by
   *   `RecipeFiltersController.buildQuery`.
   * @returns {string} Hash including the reset page and the active filters.
   */
  static buildFilterQueryHash(basePath, filters) {
    return buildFilteredHref(basePath, filters);
  }

  /**
   * Create a game recipes controller.
   *
   * @param {Function} setCanCreateRecipe - Setter for whether the requester may create a recipe.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setCanCreateRecipe, client = new GenericClient()) {
    super();
    this.setCanCreateRecipe = setCanCreateRecipe;
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
      const gameSlug = GameRecipesController.getGameSlugFromRecipesHash(this.client.currentHash());

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => Boolean(permissions.can_create_recipe))
        .catch(() => false)
        .then((canCreateRecipe) => safeSet(this.setCanCreateRecipe, canCreateRecipe));

      return () => {
        mounted = false;
      };
    };
  }
}
