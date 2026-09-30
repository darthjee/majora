import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot for the character recipe detail page (issue #1450): a link to the
 * linked `GameRecipe`'s own show page. It may `404` for non-editors when that `GameRecipe` is
 * hidden — accepted by the spec (E9); this page itself still works.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.game_slug - Game slug.
 * @param {number|string} context.game_recipe_id - Linked `GameRecipe` id.
 * @returns {React.ReactElement} Link element.
 */
export default function CharacterRecipeGameRecipeLink({ game_slug: gameSlug, game_recipe_id: gameRecipeId }) {
  return (
    <p>
      <a href={`#/games/${gameSlug}/recipes/${gameRecipeId}`} data-testid="character-recipe-game-recipe-link">
        {Translator.t('character_recipe_page.game_recipe_link')}
      </a>
    </p>
  );
}
