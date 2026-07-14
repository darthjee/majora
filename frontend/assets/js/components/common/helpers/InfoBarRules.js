import React from 'react';
import Icons from '../../../utils/ui/Icons.js';
import CharacterStatusBadges from './CharacterStatusBadges.js';
import TooltipBadge from '../TooltipBadge.jsx';

/**
 * Rules class deciding which informational items should appear in a
 * character photo's always-visible info bar (see `InfoBar`), given the full
 * character object. Takes the whole character object — rather than only
 * precomputed booleans such as `can_edit`/`is_player`/`is_pc` — so future
 * rules can react to any of its fields (page, character state, role) without
 * changing this method's call signature. Currently builds a single status
 * tooltip badge (see `CharacterStatusBadges`), omitted entirely when the
 * character has no status items to show.
 */
export default class InfoBarRules {
  /**
   * Build the list of info items to display in a character's info bar.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.is_pc] - Whether the character is a PC (vs. an NPC).
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the game.
   * @param {boolean} [character.slain] - The character's real slain state.
   * @param {boolean} [character.public_slain] - The character's public slain state.
   * @param {string} [character.allegiance] - The character's real allegiance, NPC only.
   * @param {string} [character.public_allegiance] - The character's public allegiance, NPC only.
   * @returns {{key: string, label: React.ReactElement}[]} Info item definitions to render, empty
   *   when the character has no status items.
   */
  static build(character) {
    const statusItems = CharacterStatusBadges.build(character);

    if (statusItems.length === 0) {
      return [];
    }

    return [{
      key: 'status',
      label: React.createElement(TooltipBadge, { icon: Icons.infoCircleFill, items: statusItems }),
    }];
  }
}
