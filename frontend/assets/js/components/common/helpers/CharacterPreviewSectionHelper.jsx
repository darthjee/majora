import React from 'react';
import CharacterPreviewCard from '../CharacterPreviewCard.jsx';
import SeeAllCard from '../SeeAllCard.jsx';
import { MAX_PREVIEW_CHARACTERS } from '../characterPreviewConstants.js';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterPreviewSection element.
 */
export default class CharacterPreviewSectionHelper {
  /**
   * Render a preview section with a heading, a row of small character
   * cards, and a "See all" card.
   *
   * @param {object[]} characters - List of character objects.
   * @param {string} gameSlug - Game slug used to build each card's detail link.
   * @param {string} characterType - Character type, either 'pc' or 'npc'.
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @param {string} icon - Bootstrap icon class name (see `Icons.js`) for the "See all" card.
   * @returns {React.ReactElement} Character preview section element.
   */
  static render(characters, gameSlug, characterType, title, seeAllHref, icon) {
    const preview = characters.slice(0, MAX_PREVIEW_CHARACTERS);
    const seeAllText = Translator.t('character_preview_section.see_all').replace('{{title}}', title);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        <div className="row">
          {preview.map((character) => (
            <CharacterPreviewCard
              key={character.id}
              character={character}
              gameSlug={gameSlug}
              characterType={characterType}
            />
          ))}
          <SeeAllCard icon={icon} text={seeAllText} href={seeAllHref} />
        </div>
      </div>
    );
  }
}
