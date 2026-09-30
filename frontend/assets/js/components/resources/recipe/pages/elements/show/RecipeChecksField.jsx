import React from 'react';
import RecipeTextSection from './RecipeTextSection.jsx';
import RecipeMarkdownField from './RecipeMarkdownField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the recipe's `checks` markdown section, omitted when empty.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.checks] - Markdown text.
 * @returns {React.ReactElement|null} Section element, or null when empty.
 */
function RecipeChecksFieldShow({ checks }) {
  return <RecipeTextSection title={Translator.t('recipe_page.checks_title')} text={checks} />;
}

/**
 * New/edit-mode right-column slot: the recipe's `checks` markdown editor.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.checks - Current value.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onChecksChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Markdown editor.
 */
function RecipeChecksFieldEdit({
  mode, checks, fieldErrors, handlers,
}) {
  return (
    <RecipeMarkdownField
      mode={mode}
      field="checks"
      value={checks}
      onChange={handlers.onChecksChange}
      fieldErrors={fieldErrors}
    />
  );
}

/**
 * Mode-variant `checks` slot for the recipe show/new/edit pages.
 */
const RecipeChecksField = { Show: RecipeChecksFieldShow, New: RecipeChecksFieldEdit, Edit: RecipeChecksFieldEdit };

export default RecipeChecksField;
