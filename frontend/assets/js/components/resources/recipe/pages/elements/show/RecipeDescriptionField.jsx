import React from 'react';
import RecipeTextSection from './RecipeTextSection.jsx';
import RecipeMarkdownField from './RecipeMarkdownField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the recipe's `description` markdown section, omitted when empty.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.description] - Markdown text.
 * @returns {React.ReactElement|null} Section element, or null when empty.
 */
function RecipeDescriptionFieldShow({ description }) {
  return <RecipeTextSection title={Translator.t('recipe_page.description_title')} text={description} />;
}

/**
 * New/edit-mode right-column slot: the recipe's `description` markdown editor.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.description - Current value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onDescriptionChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Markdown editor.
 */
function RecipeDescriptionFieldEdit({
  mode, description, fieldErrors, handlers,
}) {
  return (
    <RecipeMarkdownField
      mode={mode}
      field="description"
      value={description}
      onChange={handlers.onDescriptionChange}
      fieldErrors={fieldErrors}
    />
  );
}

/**
 * Mode-variant `description` slot for the recipe show/new/edit pages.
 */
const RecipeDescriptionField = { Show: RecipeDescriptionFieldShow, New: RecipeDescriptionFieldEdit, Edit: RecipeDescriptionFieldEdit };

export default RecipeDescriptionField;
