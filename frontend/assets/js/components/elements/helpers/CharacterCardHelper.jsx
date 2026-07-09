import React from 'react';
import CardAvatar from '../CardAvatar.jsx';
import PhotoUploadOverlay from '../PhotoUploadOverlay.jsx';
import Translator from '../../../i18n/Translator.js';
import Noop from '../../../utils/Noop.js';
import allegianceBorderClass from '../../../utils/AllegianceBorder.js';
import Icons from '../../../utils/Icons.js';

/**
 * Rendering helper for the CharacterCard element.
 */
export default class CharacterCardHelper {
  /**
   * Build a click handler that prevents the surrounding anchor from navigating
   * before invoking the given callback with the character object.
   *
   * @param {Function} callback - Callback to invoke with the character object.
   * @param {object} character - Character data object.
   * @returns {Function} Wrapped click handler.
   */
  static #buildOverlayClickHandler(callback, character) {
    return (event) => {
      event.preventDefault();
      event.stopPropagation();
      callback(character);
    };
  }

  /**
   * Render a Bootstrap card for a character.
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
   * @param {string} [size] - Card size, either 'normal' or 'small'.
   * @param {boolean} [canEdit] - Whether the current user may edit this NPC
   *   (meaningful only when characterType is 'npc').
   * @param {Function} [onUploadClick] - Called with the character object when the
   *   upload overlay button is clicked (NPC only).
   * @param {Function} [onSlainClick] - Called with the character object when the
   *   slain/revive overlay button is clicked (NPC only).
   * @returns {React.ReactElement} Character card element.
   */
  static render(
    character, gameSlug, characterType, size = 'normal',
    canEdit = false, onUploadClick = Noop.noop, onSlainClick = Noop.noop,
  ) {
    const isSmall = size === 'small';
    const columnClass = isSmall ? 'col-sm-3 col-md-2 col-lg-1' : 'col-sm-6 col-md-4 col-lg-3';
    const HeadingTag = isSmall ? 'h6' : 'h5';
    const cardClass = characterType === 'npc'
      ? `card h-100 ${allegianceBorderClass(character.allegiance)}`
      : 'card h-100';

    return (
      <div className={`${columnClass} mb-4`}>
        <a
          href={`#/games/${gameSlug}/${characterType}s/${character.id}`}
          className="text-decoration-none text-dark"
        >
          <div className={cardClass}>
            {CharacterCardHelper.#renderPhoto(character, characterType, canEdit, onUploadClick, onSlainClick)}
            {CharacterCardHelper.#renderCardBody(character, isSmall, HeadingTag)}
          </div>
        </a>
      </div>
    );
  }

  /**
   * Render the card's photo, using the upload/slain overlay for NPCs and the
   * plain avatar image for PCs.
   *
   * @param {object} character - Character data object.
   * @param {string} characterType - Character type, either 'pc' or 'npc'.
   * @param {boolean} canEdit - Whether the current user may edit this NPC.
   * @param {Function} onUploadClick - Called with the character object on upload click.
   * @param {Function} onSlainClick - Called with the character object on slain click.
   * @returns {React.ReactElement} Rendered photo element.
   */
  static #renderPhoto(character, characterType, canEdit, onUploadClick, onSlainClick) {
    if (characterType !== 'npc') {
      return <CardAvatar url={character.profile_photo_path} alt={character.name} />;
    }

    return (
      <PhotoUploadOverlay
        type="avatar"
        url={character.profile_photo_path}
        alt={character.name}
        canEdit={canEdit}
        onClick={CharacterCardHelper.#buildOverlayClickHandler(onUploadClick, character)}
        grayscale={character.slain}
        secondaryButton={canEdit ? {
          label: character.slain
            ? Translator.t('character_page.revive_button')
            : Translator.t('character_page.slain_button'),
          variant: character.slain ? 'success' : 'danger',
          icon: character.slain ? Icons.revivet : Icons.skull,
          onClick: CharacterCardHelper.#buildOverlayClickHandler(onSlainClick, character),
        } : undefined}
      />
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
