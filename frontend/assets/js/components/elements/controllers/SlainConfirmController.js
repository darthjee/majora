import CharacterClient from '../../../client/CharacterClient.js';

/**
 * Manages the request to toggle an NPC's slain state, shared by the NPC
 * show page and the NPC index page.
 */
export default class SlainConfirmController {
  /**
   * Creates a new SlainConfirmController instance.
   *
   * @param {Function} onSuccess - Callback invoked after the slain state is toggled successfully.
   * @param {CharacterClient} [client] - HTTP client used for the slain request.
   */
  constructor(onSuccess, client = new CharacterClient()) {
    this.onSuccess = onSuccess;
    this.client = client;
  }

  /**
   * Toggles the given character's slain state and invokes onSuccess once done.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {object} character - Character data object.
   * @param {number|string} character.id - Character id.
   * @param {boolean} character.slain - The character's *current* slain state (will be flipped).
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<void>} Resolves once the request finishes and onSuccess has been invoked.
   */
  handleConfirm(gameSlug, character, token) {
    return this.client.setNpcSlain(gameSlug, character.id, token, !character.slain)
      .then(() => this.onSuccess());
  }
}
