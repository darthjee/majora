import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: how many output units one craft yields.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {number} context.yield_quantity - Yield quantity.
 * @returns {React.ReactElement} Yield line.
 */
function RecipeYieldFieldShow({ yield_quantity: yieldQuantity }) {
  return <RecipeShowLine label={Translator.t('recipe_page.yield_label')}>{yieldQuantity}</RecipeShowLine>;
}

/**
 * Mode-variant yield slot for the recipe show/new/edit pages.
 */
const RecipeYieldField = { Show: RecipeYieldFieldShow };

export default RecipeYieldField;
