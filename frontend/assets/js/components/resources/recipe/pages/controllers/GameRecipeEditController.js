import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import BaseRecipeFormController from './BaseRecipeFormController.js';
import { buildRecipeBody, toOutputPick } from '../recipeForm.js';

const LOAD_ERROR = 'Unable to load recipe.';
const TEXT_FIELDS = ['name', 'crafting_time', 'description', 'ingredients', 'checks'];

/**
 * Controller for the game recipe edit page (issue #1449), mirroring
 * `GameCommonItemEditController`.
 *
 * @description Loads the recipe through `RequestStore.ensure` (`recipe.single`, `/full.json`
 *   for GameEdit callers) alongside the game permissions (`can_edit` decides where a hidden
 *   recipe redirects after saving), pre-fills the form, and PATCHes `recipe.single` on submit.
 */
export default class GameRecipeEditController extends BaseRecipeFormController {
  /**
   * Extract the game slug and recipe id from a game recipe edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams('/games/:game_slug/recipes/:id/edit', hash, ['game_slug', 'id']);
  }

  /**
   * Create a game recipe edit controller.
   *
   * @param {object} setters - Page state setters.
   * @param {Function} setters.setRecipe - Recipe setter.
   * @param {Function} setters.setLoading - Loading setter.
   * @param {Function} setters.setError - General error setter.
   * @param {Function} setters.setCanEditGame - Setter for the caller's game-level `can_edit`.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(setters, client = null) {
    super();
    this.setters = setters;
    this.client = client ?? new GenericClient();
  }

  /**
   * Build the page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const params = GameRecipeEditController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setters.setError, LOAD_ERROR);
        safeSet(this.setters.setLoading, false);
      } else {
        this.#loadCanEditGame(params.game_slug, safeSet);
        this.#loadRecipe(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Apply a loaded recipe's values to the edit form's state.
   *
   * @param {object|null} recipe - Loaded recipe, or null while still loading.
   * @param {Function} setField - Form-state setter, called as `setField(name, value)`.
   * @returns {void}
   */
  applyLoadedRecipe(recipe, setField) {
    if (!recipe) {
      return;
    }

    TEXT_FIELDS.forEach((field) => setField(field, recipe[field] ?? ''));
    setField('output', toOutputPick(recipe.output));
    setField('yield_quantity', String(recipe.yield_quantity ?? 1));
    setField('crafting_cost', String(recipe.crafting_cost ?? 0));
    setField('hidden', Boolean(recipe.hidden));
  }

  /**
   * Submit the recipe update (`PATCH recipe.single`), sending `game_common_item_id` only when a
   * different output was picked.
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{gameSlug: string, recipeId: (string|number), initialOutputId: (number|null),
   *   canEditGame: boolean}} context - Save context.
   * @param {object} formValues - Form values (see `RECIPE_FORM_DEFAULTS`).
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, context, formValues, setters) {
    const { gameSlug, recipeId } = context;

    return this.submitRecipe(
      event,
      {
        componentName: 'GameRecipeEditController',
        resource: 'recipe',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug, id: recipeId },
        body: buildRecipeBody(formValues, context.initialOutputId),
      },
      {
        gameSlug, recipeId, hidden: formValues.hidden, canEditGame: context.canEditGame,
      },
      setters,
    );
  }

  #loadCanEditGame(gameSlug, safeSet) {
    return AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEditGame) => safeSet(this.setters.setCanEditGame, canEditGame));
  }

  #loadRecipe(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameRecipeEditController',
      resource: 'recipe',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.id },
    })
      .then(({ data }) => safeSet(this.setters.setRecipe, data))
      .catch(() => safeSet(this.setters.setError, LOAD_ERROR))
      .finally(() => safeSet(this.setters.setLoading, false));
  }
}
