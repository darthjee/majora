import BaseRecipeExchangeTabController from './BaseRecipeExchangeTabController.js';

/**
 * Controller for the recipe exchange modal's Acquire tab (issue #1450): browses
 * `characterRecipe.availableCollection` (the game's recipes the character doesn't know yet; the
 * game-level resolver picks `available/all.json` for GameEdit) and POSTs
 * `characterRecipe.acquire` with `{game_recipe_id}` only — no hidden switch, since the new row
 * copies `GameRecipe.hidden`.
 */
export default class AcquireRecipeTabController extends BaseRecipeExchangeTabController {
  /**
   * Create an Acquire tab controller.
   */
  constructor() {
    super({
      componentName: 'AcquireRecipeTabController',
      browseQuantityType: 'availableCollection',
      mutationQuantityType: 'acquire',
    });
  }

  /**
   * Acquire goes through `acquire/all.json` only for game editors (GameEdit), so a hidden
   * `GameRecipe` can be granted on the character's behalf.
   *
   * @param {object} character - Character context (`gameCanEdit`).
   * @returns {'regular'|'private'} The variant name.
   */
  variantNameFor(character) {
    return character.gameCanEdit ? 'private' : 'regular';
  }
}
