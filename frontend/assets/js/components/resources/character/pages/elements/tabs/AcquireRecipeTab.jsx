import AcquireRecipeTabController from './controllers/AcquireRecipeTabController.js';
import AcquireRecipeTabHelper from './helpers/AcquireRecipeTabHelper.jsx';
import useRecipeExchangeTab from './shared/useRecipeExchangeTab.js';

/**
 * Acquire tab of the recipe exchange modal (issue #1450): browses the game's recipes the
 * character doesn't know yet and teaches the selected one (`{game_recipe_id}` only — no hidden
 * switch, the new row copies `GameRecipe.hidden`).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the parent modal is visible.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`,
 *   `gameCanEdit`).
 * @param {Function} props.onSuccess - Called with `{gameRecipeId}` after a successful acquire.
 * @returns {React.ReactElement} Rendered Acquire tab.
 */
export default function AcquireRecipeTab({ show, character, onSuccess }) {
  const { state, handlers } = useRecipeExchangeTab(AcquireRecipeTabController, { show, character, onSuccess });

  return AcquireRecipeTabHelper.render(state, handlers);
}
