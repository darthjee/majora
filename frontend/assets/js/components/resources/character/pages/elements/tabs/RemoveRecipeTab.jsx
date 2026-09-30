import RemoveRecipeTabController from './controllers/RemoveRecipeTabController.js';
import RemoveRecipeTabHelper from './helpers/RemoveRecipeTabHelper.jsx';
import useRecipeExchangeTab from './shared/useRecipeExchangeTab.js';

/**
 * Remove tab of the recipe exchange modal (issue #1450): browses the character's known recipes
 * and forgets the selected one (by its `game_recipe_id`).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the parent modal is visible.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `canEdit`).
 * @param {Function} props.onSuccess - Called with `{gameRecipeId}` after a successful remove.
 * @returns {React.ReactElement} Rendered Remove tab.
 */
export default function RemoveRecipeTab({ show, character, onSuccess }) {
  const { state, handlers } = useRecipeExchangeTab(RemoveRecipeTabController, { show, character, onSuccess });

  return RemoveRecipeTabHelper.render(state, handlers);
}
