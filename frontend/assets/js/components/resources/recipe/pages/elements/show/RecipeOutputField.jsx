import React from 'react';
import RecipeShowLine from './RecipeShowLine.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the recipe's output common item, linking to its page, or the
 * translated "unknown output" label when the output is masked (`null`).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {{id: number, name: string}|null} [context.output] - Output common item.
 * @param {string} context.game_slug - Game slug, used to build the common item link.
 * @returns {React.ReactElement} Output line.
 */
function RecipeOutputFieldShow({ output, game_slug: gameSlug }) {
  return (
    <RecipeShowLine label={Translator.t('recipe_page.output_label')}>
      {output
        ? <a href={`#/games/${gameSlug}/common_items/${output.id}`}>{output.name}</a>
        : Translator.t('recipe_page.unknown_output')}
    </RecipeShowLine>
  );
}

/**
 * Mode-variant output slot for the recipe show/new/edit pages.
 */
const RecipeOutputField = { Show: RecipeOutputFieldShow };

export default RecipeOutputField;
