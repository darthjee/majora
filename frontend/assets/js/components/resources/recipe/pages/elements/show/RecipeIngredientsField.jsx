import React from 'react';
import RecipeTextSection from './RecipeTextSection.jsx';
import RecipeMarkdownField from './RecipeMarkdownField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the recipe's `ingredients` markdown section, omitted when empty.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.ingredients] - Markdown text.
 * @returns {React.ReactElement|null} Section element, or null when empty.
 */
function RecipeIngredientsFieldShow({ ingredients }) {
  return <RecipeTextSection title={Translator.t('recipe_page.ingredients_title')} text={ingredients} />;
}

/**
 * New/edit-mode right-column slot: the recipe's `ingredients` markdown editor.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.ingredients - Current value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onIngredientsChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Markdown editor.
 */
function RecipeIngredientsFieldEdit({
  mode, ingredients, fieldErrors, handlers,
}) {
  return (
    <RecipeMarkdownField
      mode={mode}
      field="ingredients"
      value={ingredients}
      onChange={handlers.onIngredientsChange}
      fieldErrors={fieldErrors}
    />
  );
}

/**
 * Mode-variant `ingredients` slot for the recipe show/new/edit pages.
 */
const RecipeIngredientsField = { Show: RecipeIngredientsFieldShow, New: RecipeIngredientsFieldEdit, Edit: RecipeIngredientsFieldEdit };

export default RecipeIngredientsField;
