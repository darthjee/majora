import React from 'react';
import CardAvatar from '../CardAvatar.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';
import allegianceBorderClass from '../../../../utils/ui/AllegianceBorder.js';

/**
 * Rendering helper for the CharacterPreviewCard element.
 */
export default class CharacterPreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a character's photo, matching
   * `SeeAllCard`'s layout, with the whole card linking to the character's
   * detail page.
   *
   * @param {object} character - Character data object.
   * @param {number} character.id - Character ID.
   * @param {string} character.name - Character name.
   * @param {string|null} [character.profile_photo_path] - Optional profile photo path.
   * @param {boolean} [character.slain] - Whether the character is slain (NPC only).
   * @param {string} [character.allegiance] - Allegiance value (`'ally'`, `'enemy'`,
   *   `'neutral'`, or missing), drives the card border color for NPCs only.
   * @param {string} gameSlug - Game slug used to build the detail link.
   * @param {string} characterType - Character type, either 'pc' or 'npc'.
   * @returns {React.ReactElement} Character preview card element.
   */
  static render(character, gameSlug, characterType) {
    const cardClass = characterType === 'npc'
      ? `card h-100 ${allegianceBorderClass(character.allegiance)}`
      : 'card h-100';
    const photoClass = character.slain ? 'photo-grayscale' : '';

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={character.name}>
          <a
            href={`#/games/${gameSlug}/${characterType}s/${character.id}`}
            className="text-decoration-none text-dark"
          >
            <div className={cardClass}>
              <div className={photoClass}>
                <CardAvatar url={character.profile_photo_path} alt={character.name} />
              </div>
            </div>
          </a>
        </CardHoverTooltip>
      </div>
    );
  }
}
