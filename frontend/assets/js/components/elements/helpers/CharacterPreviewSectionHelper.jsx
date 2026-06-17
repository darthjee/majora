import React from 'react';
import CharacterCard from '../CharacterCard.jsx';
import { MAX_PREVIEW_CHARACTERS } from '../characterPreviewConstants.js';

/**
 * Rendering helper for the CharacterPreviewSection element.
 */
export default class CharacterPreviewSectionHelper {
  /**
   * Render a preview section with a heading, a row of small character
   * cards, and a "See all" link.
   *
   * @param {object[]} characters - List of character objects.
   * @param {string} gameSlug - Game slug used to build each card's detail link.
   * @param {string} characterType - Character type, either 'pc' or 'npc'.
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" link.
   * @returns {React.ReactElement} Character preview section element.
   */
  static render(characters, gameSlug, characterType, title, seeAllHref) {
    const preview = characters.slice(0, MAX_PREVIEW_CHARACTERS);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        <div className="row">
          {preview.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              gameSlug={gameSlug}
              characterType={characterType}
              size="small"
            />
          ))}
        </div>
        <a href={seeAllHref}>{`See all ${title}`}</a>
      </div>
    );
  }
}
