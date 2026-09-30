import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import BaseRecipeFormController from './BaseRecipeFormController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import { buildRecipeBody } from '../recipeForm.js';

/**
 * Controller for the game recipe creation page (issue #1449), mirroring
 * `GameCommonItemNewController` minus the deferred photo upload.
 */
export default class GameRecipeNewController extends BaseRecipeFormController {
  /**
   * Extract the game slug from a game recipe creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromRecipeNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/recipes/new', 'game_slug', hash);
  }

  /**
   * Create a game recipe new controller.
   *
   * @param {Function} [setCanEditGame] - Setter for whether the caller has game-level `can_edit`
   *   (decides where a hidden recipe redirects after saving).
   */
  constructor(setCanEditGame = Noop.noop) {
    super();
    this.setCanEditGame = setCanEditGame;
  }

  /**
   * Build the page mount effect.
   *
   * @description Resolves the game permissions: stores `can_edit`, and redirects to the recipes
   *   list when the caller may not create recipes (`can_create_recipe`) or the check fails.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const gameSlug = GameRecipeNewController.getGameSlugFromRecipeNewHash(getCurrentHash());

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#applyPermissions(permissions, gameSlug))
        .catch(() => this.#redirectToRecipes(gameSlug));
    };
  }

  /**
   * Submit the new recipe form (`POST recipe.collection`).
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {object} formValues - Form values (see `RECIPE_FORM_DEFAULTS`).
   * @param {boolean} canEditGame - Whether the caller has game-level `can_edit`.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, formValues, canEditGame, setters) {
    return this.submitRecipe(
      event,
      {
        componentName: 'GameRecipeNewController',
        resource: 'recipe',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug },
        body: buildRecipeBody(formValues),
      },
      { gameSlug, hidden: formValues.hidden, canEditGame },
      setters,
    );
  }

  #applyPermissions(permissions, gameSlug) {
    this.setCanEditGame(Boolean(permissions.can_edit));

    if (!permissions.can_create_recipe) {
      this.#redirectToRecipes(gameSlug);
    }
  }

  #redirectToRecipes(gameSlug) {
    this.redirectTo(`/games/${gameSlug}/recipes`);
  }
}
