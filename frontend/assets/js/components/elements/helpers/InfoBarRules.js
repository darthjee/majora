/**
 * Rules class deciding which informational items should appear in a
 * character photo's always-visible info bar (see `InfoBar`), given the full
 * character object. Takes the whole character object — rather than only
 * precomputed booleans such as `can_edit`/`is_player`/`is_pc` — so future
 * rules can react to any of its fields (page, character state, role) without
 * changing this method's call signature. Currently always returns no
 * content; this class exists purely to establish the extension point for
 * future informational content.
 */
export default class InfoBarRules {
  /**
   * Build the list of info items to display in a character's info bar.
   *
   * @param {object} _character - Character data object.
   * @param {boolean} [_character.is_pc] - Whether the character is a PC (vs. an NPC).
   * @param {boolean} [_character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [_character.is_player] - Whether the current user is a player of the game.
   * @returns {object[]} Info item definitions to render, currently always empty.
   */
  static build(_character) {
    return [];
  }
}
