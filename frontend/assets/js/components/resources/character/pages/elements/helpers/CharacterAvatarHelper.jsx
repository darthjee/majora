import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';
import allegianceBorderClass from '../../../../../../utils/ui/AllegianceBorder.js';
import SlainSecondaryButtons from '../../../../../common/list_types/SlainSecondaryButtons.js';
import InfoBarRules from '../../../../../common/misc/helpers/InfoBarRules.js';
import { resolveCharacterSlain, resolveCharacterAllegiance } from '../../../../../../utils/character/resolveCharacterVisibility.js';

/**
 * Rendering helper for the CharacterAvatar element.
 */
export default class CharacterAvatarHelper {
  /**
   * Render the character's picture, wrapped in an allegiance-colored border
   * for NPCs. PCs render the plain picture, unaffected by allegiance.
   *
   * @param {object} character - Character data object.
   * @param {string|null} [character.photo_path] - Optional photo path.
   * @param {string} character.name - Character name.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the game,
   *   grants upload access (for both PCs and NPCs) even without edit rights (never widens
   *   `can_edit` itself, so it does not affect the DM edit button or the slain/revive button
   *   set).
   * @param {boolean} [character.is_staff] - Whether the current user is Django staff, grants
   *   upload access (for both PCs and NPCs) even without edit rights.
   * @param {boolean} [character.private_slain] - Whether the character is (really) slain.
   * @param {boolean} [character.public_slain] - Whether the character is publicly slain.
   * @param {boolean} [character.is_pc] - Whether the character is a PC.
   * @param {string} [character.private_allegiance] - The character's real allegiance.
   * @param {string} [character.public_allegiance] - The character's publicly known allegiance;
   *   together with `private_allegiance`, drives the border color (private takes priority,
   *   falling back to public — see `resolveCharacterVisibility.js`).
   * @param {boolean} [character.hidden] - Whether the character is hidden (NPC-only concept;
   *   only present when the current user may edit the character). Drives the dimmed photo
   *   treatment, matching the same rule already applied on the NPC list page
   *   (`characterListTypes.js`'s `buildNpcActionBarProps`).
   * @param {{onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Picture element, optionally wrapped in a border.
   */
  static render(character, handlers) {
    const picture = (
      <ActionsOverlay
        type="avatar"
        url={character.photo_path}
        alt={character.name}
        canEdit={character.can_edit || character.is_player || character.is_staff}
        onClick={handlers.onOpenUploadModal}
        grayscale={resolveCharacterSlain(character)}
        dimmed={!character.is_pc && Boolean(character.hidden)}
        overlayItems={{
          secondaryButtons: CharacterAvatarHelper.#buildSecondaryButtons(character, handlers),
          infoBarItems: InfoBarRules.build(character),
        }}
      />
    );

    if (character.is_pc) {
      return picture;
    }

    return <div className={allegianceBorderClass(resolveCharacterAllegiance(character))}>{picture}</div>;
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
   * @param {boolean} [character.private_slain] - Whether the character is currently (really)
   *   slain (DM-facing data only).
   * @param {boolean} [character.public_slain] - Whether the character is currently publicly
   *   slain.
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
   * @param {boolean} [character.private_slain] - Whether the character is currently (really) slain.
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
   * as an intentional icon reuse — players only ever toggle `public_slain`
   * directly, since they never receive `private_slain`.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.public_slain] - The character's publicly known slain state.
   * @param {{onOpenPlayerSlainModal: Function}} handlers - Event handlers.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions.
   */
  static #buildPlayerSecondaryButtons(character, handlers) {
    return [
      SlainSecondaryButtons.buildSlainButton(character.public_slain, handlers.onOpenPlayerSlainModal),
    ];
  }
}
