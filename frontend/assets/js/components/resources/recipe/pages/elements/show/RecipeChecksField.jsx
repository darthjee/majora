import React from 'react';
import RecipeTextSection from './RecipeTextSection.jsx';
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
 * Mode-variant `checks` slot for the recipe show/new/edit pages.
 */
const RecipeChecksField = { Show: RecipeChecksFieldShow };

export default RecipeChecksField;
