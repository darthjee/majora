import CharacterClient from '../../../client/CharacterClient.js';

/**
 * Manages the request to toggle an NPC's slain or public_slain state, shared
 * by the NPC show page and the NPC index page.
 */
export default class SlainConfirmController {
  /**
   * Creates a new SlainConfirmController instance.
   *
   * @param {Function} onSuccess - Callback invoked after the slain state is toggled successfully.
   * @param {'slain'|'public_slain'} [field] - Character field this controller toggles.
   * @param {CharacterClient} [client] - HTTP client used for the slain request.
   */
  constructor(onSuccess, field = 'slain', client = new CharacterClient()) {
    this.onSuccess = onSuccess;
    this.field = field;
    this.client = client;
  }

  /**
   * Toggles the given character's target field and invokes onSuccess once done.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {object} character - Character data object.
   * @param {number|string} character.id - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<void>} Resolves once the request finishes and onSuccess has been invoked.
   */
  handleConfirm(gameSlug, character, token) {
    const fields = { [this.field]: !character[this.field] };

    return this.client.setNpcSlain(gameSlug, character.id, token, fields)
      .then(() => this.onSuccess());
  }
}
