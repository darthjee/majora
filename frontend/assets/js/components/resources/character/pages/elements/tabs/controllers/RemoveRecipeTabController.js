import BaseRecipeExchangeTabController from './BaseRecipeExchangeTabController.js';

/**
 * Controller for the recipe exchange modal's Remove tab (issue #1450): browses the character's
 * own `characterRecipe.collection` and POSTs `characterRecipe.remove` with the entry's
 * `game_recipe_id` (not its row `id`), through `remove/all.json` when the caller can edit the
 * character (`canEdit`: CharacterEdit for PCs, GameEdit for NPCs).
 */
export default class RemoveRecipeTabController extends BaseRecipeExchangeTabController {
  /**
   * Create a Remove tab controller.
   */
  constructor() {
    super({
      componentName: 'RemoveRecipeTabController',
      browseQuantityType: 'collection',
      mutationQuantityType: 'remove',
    });
  }

  /**
   * A `CharacterRecipe` entry's own `id` is its row id; the endpoint expects the linked
   * `GameRecipe` id.
   *
   * @param {object} selected - Selected `CharacterRecipe` entry.
   * @returns {number} The linked `GameRecipe` id.
   */
  gameRecipeIdOf(selected) {
    return selected.game_recipe_id;
  }
}
