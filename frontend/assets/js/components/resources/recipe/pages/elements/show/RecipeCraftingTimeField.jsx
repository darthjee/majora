import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formFieldId, formKey } from './recipeFormKeys.js';

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
 * New/edit-mode right-column slot: the optional free-text crafting time input.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.crafting_time - Current crafting time value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onCraftingTimeChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Crafting time form field.
 */
function RecipeCraftingTimeFieldEdit({
  mode, crafting_time: craftingTime, fieldErrors = {}, handlers,
}) {
  return (
    <FormField
      id={formFieldId(mode, 'crafting-time')}
      type="text"
      label={Translator.t(formKey(mode, 'crafting_time_label'))}
      value={craftingTime}
      onChange={handlers.onCraftingTimeChange}
      errors={fieldErrors.crafting_time ?? []}
    />
  );
}

/**
 * Mode-variant crafting time slot for the recipe show/new/edit pages.
 */
const RecipeCraftingTimeField = {
  Show: RecipeCraftingTimeFieldShow, New: RecipeCraftingTimeFieldEdit, Edit: RecipeCraftingTimeFieldEdit,
};

export default RecipeCraftingTimeField;
