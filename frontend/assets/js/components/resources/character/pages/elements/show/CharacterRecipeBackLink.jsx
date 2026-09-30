import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot for the character recipe detail page (issue #1450): a back link to
 * the character's recipes list, labelled `character_recipe_page.back_link`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.backHref - Hash path to the character's recipes list.
 * @returns {React.ReactElement} Back link element.
 */
export default function CharacterRecipeBackLink({ backHref }) {
  return (
    <a href={backHref} className="btn btn-outline-secondary mb-3" data-testid="character-recipe-back-link">
      &larr; {Translator.t('character_recipe_page.back_link')}
    </a>
  );
}
