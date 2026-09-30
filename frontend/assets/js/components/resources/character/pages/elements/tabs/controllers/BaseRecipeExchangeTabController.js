import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const ERROR_KEY_BY_STATUS = {
  422: 'recipe_exchange_modal.already_owned_error',
  404: 'recipe_exchange_modal.not_found_error',
};

const GENERIC_ERROR_KEY = 'recipe_exchange_modal.generic_error';

/**
 * Default page size for the recipe exchange tabs' browse lists.
 */
export const PER_PAGE = 10;

/**
 * Shared browse/submit logic for the recipe exchange modal's Acquire and Remove tabs (issue
 * #1450), modeled on `AcquireDocumentTabController`/`RemoveDocumentTabController`.
 *
 * @description Subclasses provide the `characterRecipe` quantity types to browse and mutate
 *   through, plus {@link BaseRecipeExchangeTabController#gameRecipeIdOf} and
 *   {@link BaseRecipeExchangeTabController#variantNameFor}. Every submit posts
 *   `{game_recipe_id}` only; a `422` maps to `already_owned_error`, a `404` to
 *   `not_found_error`, anything else non-2xx to `generic_error`. On success both
 *   `characterRecipe` and `recipe` (whose "Known by" list changes too) are purged.
 */
export default class BaseRecipeExchangeTabController {
  /**
   * Create a recipe exchange tab controller.
   *
   * @param {object} config - Tab configuration.
   * @param {string} config.componentName - Name attached to `RequestStore` debug logs.
   * @param {string} config.browseQuantityType - `characterRecipe` GET quantity type to browse.
   * @param {string} config.mutationQuantityType - `characterRecipe` POST quantity type to submit.
   */
  constructor({ componentName, browseQuantityType, mutationQuantityType }) {
    this.componentName = componentName;
    this.browseQuantityType = browseQuantityType;
    this.mutationQuantityType = mutationQuantityType;
  }

  /**
   * The `GameRecipe` id to submit for a selected browse entry.
   *
   * @param {object} selected - Selected browse entry.
   * @returns {number} The `GameRecipe` id.
   */
  gameRecipeIdOf(selected) {
    return selected.id;
  }

  /**
   * The endpoint variant to submit through for a character context.
   *
   * @param {object} character - Character context (`canEdit`, `gameCanEdit`).
   * @returns {'regular'|'private'} The variant name.
   */
  variantNameFor(character) {
    return character.canEdit ? 'private' : 'regular';
  }

  /**
   * Fetch one browse page through `RequestStore`.
   *
   * @param {object} character - Character context (`game_slug`, `id`, `is_pc`).
   * @param {{page: number, perPage: number, search: string}} browseParams - Browse params.
   * @returns {Promise<{data: object[], pagination: object}>} Browse page with pagination metadata.
   */
  fetchPage(character, { page, perPage, search }) {
    return RequestStore.ensure({
      componentName: this.componentName,
      resource: 'characterRecipe',
      quantityType: this.browseQuantityType,
      params: BaseRecipeExchangeTabController.#params(character),
      query: { page, per_page: perPage, name: search },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Load one browse page, updating `setBrowse` through the loading/success/error cycle.
   *
   * @param {number} page - Page number to request.
   * @param {object} character - Character context.
   * @param {string} searchTerm - Current name filter.
   * @param {Function} setBrowse - React state setter for `{items, page, pages, loading, error}`.
   * @returns {Promise<void>} Resolves once `setBrowse` has been called with the outcome.
   */
  loadPage(page, character, searchTerm, setBrowse) {
    setBrowse((prev) => ({ ...prev, loading: true, error: '' }));

    return this.fetchPage(character, { page, perPage: PER_PAGE, search: searchTerm })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'recipe_exchange_modal.load_error',
      })));
  }

  /**
   * Submit `{game_recipe_id}` through `RequestStore.mutate`.
   *
   * @param {object} character - Character context.
   * @param {number} gameRecipeId - `GameRecipe` id.
   * @returns {Promise<{ok: boolean, errorKey?: string}>} The parsed outcome.
   */
  submit(character, gameRecipeId) {
    return RequestStore.mutate({
      componentName: this.componentName,
      resource: 'characterRecipe',
      method: 'POST',
      quantityType: this.mutationQuantityType,
      params: BaseRecipeExchangeTabController.#params(character),
      body: { game_recipe_id: gameRecipeId },
      variantName: this.variantNameFor(character),
    }).then((response) => BaseRecipeExchangeTabController.#parseResponse(response));
  }

  /**
   * Submit the selected entry, then apply the outcome: on success purge `characterRecipe` and
   * `recipe`, clear the selection, call `onSuccess` and reload the page; otherwise surface the
   * error key.
   *
   * @param {object} selected - Currently selected browse entry.
   * @param {object} character - Character context.
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks.
   * @returns {Promise<void>} Resolves once the outcome has been applied.
   */
  confirm(selected, character, setters) {
    const gameRecipeId = this.gameRecipeIdOf(selected);

    setters.setSubmitting(true);

    return this.submit(character, gameRecipeId).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      RequestStore.purge({ resource: 'characterRecipe' });
      RequestStore.purge({ resource: 'recipe' });
      setters.setSelected(null);
      setters.onSuccess({ gameRecipeId });
      setters.reload();
    });
  }

  /**
   * Map a failed response status to its translation key.
   *
   * @param {number} status - HTTP status.
   * @returns {string} Translation key.
   */
  static errorKeyFor(status) {
    return ERROR_KEY_BY_STATUS[status] ?? GENERIC_ERROR_KEY;
  }

  static #params(character) {
    return { gameSlug: character.game_slug, kind: character.is_pc ? 'pcs' : 'npcs', id: character.id };
  }

  static #parseResponse(response) {
    if (response.ok) {
      return { ok: true };
    }

    return { ok: false, errorKey: BaseRecipeExchangeTabController.errorKeyFor(response.status) };
  }
}
