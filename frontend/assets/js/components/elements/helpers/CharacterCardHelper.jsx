import React from 'react';
import CardAvatar from '../CardAvatar.jsx';
import ActionsOverlay from '../ActionsOverlay.jsx';
import Noop from '../../../utils/Noop.js';
import allegianceBorderClass from '../../../utils/AllegianceBorder.js';
import SlainSecondaryButtons from './SlainSecondaryButtons.js';

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
   * @param {boolean} [character.slain] - Whether the character is (really) slain (NPC only).
   * @param {boolean} [character.public_slain] - Whether the character is publicly slain
   *   (NPC only, DM-facing data only).
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
   *   real slain/revive overlay button is clicked (NPC only).
   * @param {Function} [onPublicSlainClick] - Called with the character object when the
   *   public slain/revive overlay button is clicked (NPC only).
   * @param {boolean} [playerOptions.isPlayer] - Whether the current user is a player of the
   *   game (meaningful only when characterType is 'npc' and canEdit is false).
   * @param {Function} [playerOptions.onPlayerSlainClick] - Called with the character object
   *   when the player-facing slain/revive overlay button is clicked (NPC only).
   * @param {{isPlayer?: boolean, onPlayerSlainClick?: Function}} [playerOptions] - Player-facing
   *   slain toggle options, grouped to keep this method's parameter count in check.
   * @returns {React.ReactElement} Character card element.
   */
  static render(
    character, gameSlug, characterType, size = 'normal', canEdit = false,
    onUploadClick = Noop.noop, onSlainClick = Noop.noop, onPublicSlainClick = Noop.noop,
    playerOptions = {},
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
            {CharacterCardHelper.#renderPhoto(
              character, characterType, canEdit, onUploadClick, onSlainClick, onPublicSlainClick,
              playerOptions,
            )}
            {CharacterCardHelper.#renderCardBody(character, isSmall, HeadingTag)}
          </div>
        </a>
      </div>
    );
  }

  /**
   * Build the DM's real and public slain/revive secondary button definitions.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - The character's real slain state.
   * @param {boolean} [character.public_slain] - The character's public slain state.
   * @param {Function} onSlainClick - Called with the character object on real slain click.
   * @param {Function} onPublicSlainClick - Called with the character object on public slain click.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions.
   */
  static #buildDmSecondaryButtons(character, onSlainClick, onPublicSlainClick) {
    return SlainSecondaryButtons.buildDmButtons(
      character,
      CharacterCardHelper.#buildOverlayClickHandler(onSlainClick, character),
      CharacterCardHelper.#buildOverlayClickHandler(onPublicSlainClick, character),
    );
  }

  /**
   * Build the secondary slain/revive button definitions: the DM's real and
   * public toggle pair when canEdit is true, or a single player-facing
   * toggle when the current user is merely a player of the game.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - The character's real slain state for a DM, or its
   *   public-facing slain alias for a non-editor.
   * @param {boolean} [character.public_slain] - The character's public slain state (DM-facing
   *   data only).
   * @param {boolean} canEdit - Whether the current user may edit this NPC.
   * @param {Function} onSlainClick - Called with the character object on real slain click.
   * @param {Function} onPublicSlainClick - Called with the character object on public slain click.
   * @param {{isPlayer?: boolean, onPlayerSlainClick?: Function}} playerOptions - Player-facing
   *   slain toggle options.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions, empty when neither canEdit nor isPlayer applies.
   */
  static #buildSecondaryButtons(character, canEdit, onSlainClick, onPublicSlainClick, playerOptions) {
    if (canEdit) {
      return CharacterCardHelper.#buildDmSecondaryButtons(character, onSlainClick, onPublicSlainClick);
    }

    const { isPlayer = false, onPlayerSlainClick = Noop.noop } = playerOptions;

    if (!isPlayer) {
      return [];
    }

    return [
      SlainSecondaryButtons.buildSlainButton(
        character.slain,
        CharacterCardHelper.#buildOverlayClickHandler(onPlayerSlainClick, character),
      ),
    ];
  }

  /**
   * Render the card's photo, using the upload/slain overlay for NPCs and the
   * plain avatar image for PCs.
   *
   * @param {object} character - Character data object.
   * @param {string} characterType - Character type, either 'pc' or 'npc'.
   * @param {boolean} canEdit - Whether the current user may edit this NPC.
   * @param {Function} onUploadClick - Called with the character object on upload click.
   * @param {Function} onSlainClick - Called with the character object on real slain click.
   * @param {Function} onPublicSlainClick - Called with the character object on public slain click.
   * @param {{isPlayer?: boolean, onPlayerSlainClick?: Function}} playerOptions - Player-facing
   *   slain toggle options.
   * @returns {React.ReactElement} Rendered photo element.
   */
  static #renderPhoto(character, characterType, canEdit, onUploadClick, onSlainClick, onPublicSlainClick, playerOptions) {
    if (characterType !== 'npc') {
      return <CardAvatar url={character.profile_photo_path} alt={character.name} />;
    }

    return (
      <ActionsOverlay
        type="avatar"
        url={character.profile_photo_path}
        alt={character.name}
        canEdit={canEdit}
        onClick={CharacterCardHelper.#buildOverlayClickHandler(onUploadClick, character)}
        grayscale={character.slain}
        secondaryButtons={CharacterCardHelper.#buildSecondaryButtons(
          character, canEdit, onSlainClick, onPublicSlainClick, playerOptions,
        )}
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
