import React from 'react';
import RecipeTextSection from './RecipeTextSection.jsx';
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
 * Mode-variant `ingredients` slot for the recipe show/new/edit pages.
 */
const RecipeIngredientsField = { Show: RecipeIngredientsFieldShow };

export default RecipeIngredientsField;
