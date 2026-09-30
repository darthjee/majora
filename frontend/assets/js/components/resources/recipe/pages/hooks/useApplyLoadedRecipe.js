import { useEffect } from 'react';

/**
 * Applies a newly loaded recipe's values onto the edit form's state, via
 * `controller.applyLoadedRecipe`, mirroring `useApplyLoadedCommonItem`.
 *
 * @param {import('../controllers/GameRecipeEditController.js').default} controller - Owns
 *   `applyLoadedRecipe`.
 * @param {object|null} recipe - Loaded recipe, or null while still loading.
 * @param {Function} setField - Form-state setter, called as `setField(name, value)`.
 * @returns {void}
 */
export default function useApplyLoadedRecipe(controller, recipe, setField) {
  useEffect(() => {
    controller.applyLoadedRecipe(recipe, setField);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe]);
}
