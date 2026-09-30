import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import FieldErrors from '../../../../../common/forms/FieldErrors.jsx';
import TreasureMoney from '../../../../../common/misc/TreasureMoney.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formKey } from './recipeFormKeys.js';

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
 * New/edit-mode right-column slot: the collapsed crafting cost, paired with a button opening the
 * `MoneyEditModal` wired by the owning page, mirroring `CommonItemPriceField`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string|number} context.crafting_cost - Current crafting cost value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onOpenCostModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Crafting cost form field.
 */
function RecipeCraftingCostFieldEdit({
  mode, crafting_cost: craftingCost, fieldErrors = {}, handlers,
}) {
  return (
    <div className="mb-3">
      <label className="form-label">{Translator.t(formKey(mode, 'crafting_cost_label'))}</label>
      <div><TreasureMoney value={Number(craftingCost) || 0} /></div>
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlers.onOpenCostModal}>
        {Translator.t(formKey(mode, 'crafting_cost_edit_button'))}
      </button>
      <FieldErrors errors={fieldErrors.crafting_cost ?? []} />
    </div>
  );
}

/**
 * Mode-variant crafting cost slot for the recipe show/new/edit pages.
 */
const RecipeCraftingCostField = {
  Show: RecipeCraftingCostFieldShow, New: RecipeCraftingCostFieldEdit, Edit: RecipeCraftingCostFieldEdit,
};

export default RecipeCraftingCostField;
