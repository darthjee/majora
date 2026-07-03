import React from 'react';
import CardAvatar from '../CardAvatar.jsx';

/**
 * Rendering helper for the CharacterCard element.
 */
export default class CharacterCardHelper {
  /**
   * Render a Bootstrap card for a character.
   *
   * @param {object} character - Character data object.
   * @param {number} character.id - Character ID.
   * @param {string} character.name - Character name.
   * @param {string|null} [character.profile_photo_path] - Optional profile photo path.
   * @param {string} gameSlug - Game slug used to build the detail link.
   * @param {string} characterType - Character type, either 'pc' or 'npc'.
   * @param {string} [size] - Card size, either 'normal' or 'small'.
   * @returns {React.ReactElement} Character card element.
   */
  static render(character, gameSlug, characterType, size = 'normal') {
    const isSmall = size === 'small';
    const columnClass = isSmall ? 'col-sm-3 col-md-2 col-lg-1' : 'col-sm-6 col-md-4 col-lg-3';
    const HeadingTag = isSmall ? 'h6' : 'h5';

    return (
      <div className={`${columnClass} mb-4`}>
        <a
          href={`#/games/${gameSlug}/${characterType}s/${character.id}`}
          className="text-decoration-none text-dark"
        >
          <div className="card h-100">
            <CardAvatar url={character.profile_photo_path} alt={character.name} />
            {CharacterCardHelper.#renderCardBody(character, isSmall, HeadingTag)}
          </div>
        </a>
      </div>
    );
  }

  /**
   * Render the card body containing the character name, unless the card is
   * rendered in the small size variant.
   *
   * @param {object} character - Character data object.
   * @param {string} character.name - Character name.
   * @param {boolean} isSmall - Whether the card is the small size variant.
   * @param {string} HeadingTag - Heading tag name used for the title.
   * @returns {React.ReactElement|null} Card body element, or null when small.
   */
  static #renderCardBody(character, isSmall, HeadingTag) {
    if (isSmall) {
      return null;
    }

    return (
      <div className="card-body">
        <HeadingTag className="card-title">{character.name}</HeadingTag>
      </div>
    );
  }
}
