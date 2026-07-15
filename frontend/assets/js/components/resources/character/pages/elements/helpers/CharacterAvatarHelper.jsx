import React from 'react';
import ActionsOverlay from '../../../../../common/ActionsOverlay.jsx';
import allegianceBorderClass from '../../../../../../utils/ui/AllegianceBorder.js';
import SlainSecondaryButtons from '../../../../../common/helpers/SlainSecondaryButtons.js';
import InfoBarRules from '../../../../../common/helpers/InfoBarRules.js';

/**
 * Rendering helper for the CharacterAvatar element.
 */
export default class CharacterAvatarHelper {
  /**
   * Render the character's picture, wrapped in an allegiance-colored border
   * for NPCs. PCs render the plain picture, unaffected by allegiance.
   *
   * @param {object} character - Character data object.
   * @param {string|null} [character.profile_photo_path] - Optional profile photo path.
   * @param {string} character.name - Character name.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the game,
   *   grants NPC upload access even without edit rights (never widens `can_edit` itself, so
   *   it does not affect the DM edit button or the slain/revive button set).
   * @param {boolean} [character.slain] - Whether the character is (really) slain.
   * @param {boolean} [character.public_slain] - Whether the character is publicly slain.
   * @param {boolean} [character.is_pc] - Whether the character is a PC.
   * @param {string} [character.allegiance] - Allegiance value driving the border color.
   * @param {{onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Picture element, optionally wrapped in a border.
   */
  static render(character, handlers) {
    const picture = (
      <ActionsOverlay
        type="avatar"
        url={character.profile_photo_path}
        alt={character.name}
        canEdit={character.can_edit || (!character.is_pc && character.is_player)}
        onClick={handlers.onOpenUploadModal}
        grayscale={character.slain}
        secondaryButtons={CharacterAvatarHelper.#buildSecondaryButtons(character, handlers)}
        infoBarItems={InfoBarRules.build(character)}
      />
    );

    if (character.is_pc) {
      return picture;
    }

    return <div className={allegianceBorderClass(character.allegiance)}>{picture}</div>;
  }

  /**
   * Build the secondary slain/revive button definitions for an NPC's picture
   * overlay: the DM's real and public toggle pair when the current user may
   * edit the character, or a single player-facing toggle when the current
   * user is merely a player of the game. PCs, and NPCs the current user has
   * no access to toggle, get no buttons.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.is_pc] - Whether the character is a PC.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the game.
   * @param {boolean} [character.slain] - Whether the character is currently (really) slain
   *   for a DM, or its public-facing slain alias for a non-editor.
   * @param {boolean} [character.public_slain] - Whether the character is currently publicly
   *   slain (DM-facing data only).
   * @param {{onOpenSlainModal: Function, onOpenPublicSlainModal: Function,
   *   onOpenPlayerSlainModal: Function}} handlers - Event handlers.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions, empty when not applicable.
   */
  static #buildSecondaryButtons(character, handlers) {
    if (character.is_pc) {
      return [];
    }

    if (character.can_edit) {
      return CharacterAvatarHelper.#buildDmSecondaryButtons(character, handlers);
    }

    if (character.is_player) {
      return CharacterAvatarHelper.#buildPlayerSecondaryButtons(character, handlers);
    }

    return [];
  }

  /**
   * Build the DM's real and public slain/revive secondary button definitions.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - Whether the character is currently (really) slain.
   * @param {boolean} [character.public_slain] - Whether the character is currently publicly slain.
   * @param {{onOpenSlainModal: Function, onOpenPublicSlainModal: Function}} handlers - Event handlers.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions.
   */
  static #buildDmSecondaryButtons(character, handlers) {
    return SlainSecondaryButtons.buildDmButtons(
      character, handlers.onOpenSlainModal, handlers.onOpenPublicSlainModal,
    );
  }

  /**
   * Build the single player-facing slain/revive secondary button definition,
   * reusing the DM's real-slain button shape (`Icons.heart`/`Icons.skullFill`)
   * as an intentional icon reuse — players only ever toggle `public_slain`,
   * which is already the value aliased onto `character.slain` for non-editors.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - The character's public-facing slain alias.
   * @param {{onOpenPlayerSlainModal: Function}} handlers - Event handlers.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions.
   */
  static #buildPlayerSecondaryButtons(character, handlers) {
    return [
      SlainSecondaryButtons.buildSlainButton(character.slain, handlers.onOpenPlayerSlainModal),
    ];
  }
}
