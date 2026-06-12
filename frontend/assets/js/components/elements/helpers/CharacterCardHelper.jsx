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
   * @param {string|null} [character.avatar_url] - Optional avatar URL.
   * @param {string} gameSlug - Game slug used to build the detail link.
   * @returns {React.ReactElement} Character card element.
   */
  static render(character, gameSlug) {
    return (
      <div className="col-sm-6 col-md-4 col-lg-3 mb-4">
        <a
          href={`#/games/${gameSlug}/characters/${character.id}`}
          className="text-decoration-none text-dark"
        >
          <div className="card h-100">
            <CardAvatar url={character.avatar_url} alt={character.name} />
            <div className="card-body">
              <h5 className="card-title">{character.name}</h5>
            </div>
          </div>
        </a>
      </div>
    );
  }
}
