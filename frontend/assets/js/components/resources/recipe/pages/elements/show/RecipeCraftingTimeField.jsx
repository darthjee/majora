import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the recipe's free-text crafting time, omitted when blank.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.crafting_time] - Crafting time text.
 * @returns {React.ReactElement|null} Crafting time line, or null when blank.
 */
function RecipeCraftingTimeFieldShow({ crafting_time: craftingTime }) {
  if (!craftingTime) {
    return null;
  }

  return <RecipeShowLine label={Translator.t('recipe_page.crafting_time_label')}>{craftingTime}</RecipeShowLine>;
}

/**
 * Mode-variant crafting time slot for the recipe show/new/edit pages.
 */
const RecipeCraftingTimeField = { Show: RecipeCraftingTimeFieldShow };

export default RecipeCraftingTimeField;
