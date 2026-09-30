import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import { savedRecipePath } from '../recipeForm.js';

/**
 * Shared submit handling for the recipe new/edit controllers (issue #1449).
 *
 * @description Sends the mutation through {@link RequestStore.mutate}, then on success purges
 *   every cached `recipe` read (list, detail and the common-item shortlists) and redirects to the
 *   saved recipe's show page — or to the recipes list when a caller without game-level `can_edit`
 *   saved it hidden. A `400` sets the field errors (e.g. `game_common_item_id` for an invalid
 *   output); any other failure sets the `error` status.
 */
export default class BaseRecipeFormController extends BasePageController {
  /**
   * Submit a recipe create/update mutation.
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {object} mutation - `RequestStore.mutate` options (resource, method, params, body...).
   * @param {{gameSlug: string, recipeId: (number|string|undefined), hidden: boolean,
   *   canEditGame: boolean}} context - Save context used to pick the redirect target.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitRecipe(event, mutation, context, setters) {
    event?.preventDefault?.();
    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate(mutation);

      await this.#handleResponse(response, context, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  async #handleResponse(response, context, setters) {
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      RequestStore.purge({ resource: 'recipe' });
      this.redirectTo(savedRecipePath(
        context.gameSlug, data.id ?? context.recipeId, context.hidden, context.canEditGame,
      ));
      return;
    }

    if (response.status === 400) {
      setters.setFieldErrors(data.errors ?? {});
      setters.setStatus('idle');
      return;
    }

    setters.setStatus('error');
  }
}
