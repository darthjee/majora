import CharacterClient from '../../../client/CharacterClient.js';

/**
 * Manages the player-facing request to toggle an NPC's public_slain state,
 * shared by the NPC show page and the NPC index page. Unlike
 * {@link SlainConfirmController}, this always PATCHes the plain NPC endpoint
 * (never `full.json`), since players may only ever toggle `public_slain`.
 */
export default class PlayerSlainConfirmController {
  /**
   * Creates a new PlayerSlainConfirmController instance.
   *
   * @param {Function} onSuccess - Callback invoked after the slain state is toggled successfully.
   * @param {CharacterClient} [client] - HTTP client used for the slain request.
   */
  constructor(onSuccess, client = new CharacterClient()) {
    this.onSuccess = onSuccess;
    this.client = client;
  }

  /**
   * Toggles the given character's public_slain state (aliased onto `slain` for
   * non-editors) as a player of the game, and invokes onSuccess once done.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {object} character - Character data object.
   * @param {number|string} character.id - Character id.
   * @param {boolean} character.slain - Current public-facing slain value.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<void>} Resolves once the request finishes and onSuccess has been invoked.
   */
  handleConfirm(gameSlug, character, token) {
    return this.client.setNpcPublicSlainAsPlayer(gameSlug, character.id, token, !character.slain)
      .then(() => this.onSuccess());
  }
}
