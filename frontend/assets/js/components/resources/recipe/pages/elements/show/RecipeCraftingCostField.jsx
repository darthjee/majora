import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import TreasureMoney from '../../../../../common/misc/TreasureMoney.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the recipe's crafting cost, displayed via `TreasureMoney` like
 * `CommonItemPriceField` (lowest-denomination integer, default currency model).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {number} [context.crafting_cost] - Crafting cost, in the lowest denomination.
 * @returns {React.ReactElement} Crafting cost line.
 */
function RecipeCraftingCostFieldShow({ crafting_cost: craftingCost }) {
  return (
    <RecipeShowLine label={Translator.t('recipe_page.crafting_cost_label')}>
      <TreasureMoney value={craftingCost ?? 0} />
    </RecipeShowLine>
  );
}

/**
 * Mode-variant crafting cost slot for the recipe show/new/edit pages.
 */
const RecipeCraftingCostField = { Show: RecipeCraftingCostFieldShow };

export default RecipeCraftingCostField;
