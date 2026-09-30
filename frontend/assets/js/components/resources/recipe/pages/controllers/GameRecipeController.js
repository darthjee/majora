import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

const LOAD_ERROR = 'Unable to load recipe.';

/**
 * Controller for the game recipe detail page (issue #1449), mirroring `GameCommonItemController`
 * minus the photo-upload gate.
 *
 * @description Fetches the `GameRecipe` through `RequestStore.ensure({resource: 'recipe',
 *   quantityType: 'single', params: {gameSlug, id}})`, which resolves the requester's game-level
 *   edit permission to pick between `recipes/:id/full.json` and `recipes/:id.json`. Independently
 *   derives `canEdit` from `AccessStore.ensureRecipePermissions` (`/permissions/game_recipe.json`,
 *   fail-closed), exposed to gate the Edit button only.
 */
export default class GameRecipeController extends BasePageController {
  /**
   * Extract the game slug and recipe id from a game recipe detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams('/games/:game_slug/recipes/:id', hash, ['game_slug', 'id']);
  }

  /**
   * Create a game recipe controller.
   *
   * @param {Function} setRecipe - Recipe setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanEdit - Setter for whether the requester may edit this recipe.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setRecipe, setLoading, setError, setCanEdit, client = new GenericClient()) {
    super();
    this.setRecipe = setRecipe;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanEdit = setCanEdit;
    this.client = client;
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
      const params = GameRecipeController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, LOAD_ERROR);
        safeSet(this.setLoading, false);
      } else {
        this.#loadCanEdit(params.game_slug, safeSet);
        this.#fetchRecipe(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadCanEdit(gameSlug, safeSet) {
    return AccessStore.ensureRecipePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => safeSet(this.setCanEdit, canEdit));
  }

  #fetchRecipe(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameRecipeController',
      resource: 'recipe',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.id },
    })
      .then(({ data }) => safeSet(this.setRecipe, data))
      .catch(() => safeSet(this.setError, LOAD_ERROR))
      .finally(() => safeSet(this.setLoading, false));
  }
}
