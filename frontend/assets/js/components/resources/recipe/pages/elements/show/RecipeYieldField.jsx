import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formFieldId, formKey } from './recipeFormKeys.js';

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
 * New/edit-mode right-column slot: the integer yield input (min 1, validated server-side).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.yield_quantity - Current yield value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onYieldChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Yield form field.
 */
function RecipeYieldFieldEdit({
  mode, yield_quantity: yieldQuantity, fieldErrors = {}, handlers,
}) {
  return (
    <FormField
      id={formFieldId(mode, 'yield')}
      type="number"
      label={Translator.t(formKey(mode, 'yield_label'))}
      value={yieldQuantity}
      onChange={handlers.onYieldChange}
      errors={fieldErrors.yield_quantity ?? []}
    />
  );
}

/**
 * Mode-variant yield slot for the recipe show/new/edit pages.
 */
const RecipeYieldField = { Show: RecipeYieldFieldShow, New: RecipeYieldFieldEdit, Edit: RecipeYieldFieldEdit };

export default RecipeYieldField;
