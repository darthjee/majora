import RequestStore from '../../../../../../utils/requests/RequestStore.js';

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
   */
  constructor(onSuccess) {
    this.onSuccess = onSuccess;
  }

  /**
   * Toggles the given character's public_slain state as a player of the game, and invokes
   * onSuccess once done.
   *
   * @description PATCHes the plain NPC endpoint (`npc`'s `regular` variant) through
   *   {@link RequestStore.mutate} (issue #847), forcing `variantName: 'regular'` since this
   *   controller is only ever wired to the player-facing toggle. Purges the NPC resource's
   *   cached `GET` data on success before invoking `onSuccess`, so the list's `refresh()`
   *   callback doesn't just re-serve a stale cached response.
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {object} character - Character data object.
   * @param {number|string} character.id - Character id.
   * @param {boolean} character.public_slain - Current public-facing slain value.
   * @param {string|null} _token - Authentication token, unused — kept for call-site
   *   compatibility; `RequestStore.mutate` resolves its own token.
   * @returns {Promise<void>} Resolves once the request finishes and onSuccess has been invoked.
   */
  handleConfirm(gameSlug, character, _token) {
    return RequestStore.mutate({
      componentName: 'PlayerSlainConfirmController',
      resource: 'npc',
      method: 'PATCH',
      quantityType: 'single',
      params: { gameSlug, id: character.id },
      body: { public_slain: !character.public_slain },
      variantName: 'regular',
    }).then((response) => {
      if (!response.ok) {
        return;
      }

      RequestStore.purge({ resource: 'npc' });
      this.onSuccess();
    });
  }
}
