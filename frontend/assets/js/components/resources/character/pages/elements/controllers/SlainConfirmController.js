import RequestStore from '../../../../../../utils/requests/RequestStore.js';

/**
 * Manages the request to toggle an NPC's slain or public_slain state, shared
 * by the NPC show page and the NPC index page.
 */
export default class SlainConfirmController {
  /**
   * Creates a new SlainConfirmController instance.
   *
   * @param {Function} onSuccess - Callback invoked after the slain state is toggled successfully.
   * @param {'private_slain'|'public_slain'} [field] - Character field this controller toggles.
   */
  constructor(onSuccess, field = 'private_slain') {
    this.onSuccess = onSuccess;
    this.field = field;
  }

  /**
   * Toggles the given character's target field and invokes onSuccess once done.
   *
   * @description PATCHes the DM/admin `full.json` endpoint (`npc`'s `private` variant) through
   *   {@link RequestStore.mutate} (issue #847), forcing `variantName: 'private'` since this
   *   controller is only ever wired to the DM/admin-only toggle. Purges the NPC resource's
   *   cached `GET` data on success before invoking `onSuccess`, so the list's `refresh()`
   *   callback doesn't just re-serve a stale cached response.
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {object} character - Character data object.
   * @param {number|string} character.id - Character id.
   * @param {string|null} _token - Authentication token, unused — kept for call-site
   *   compatibility; `RequestStore.mutate` resolves its own token.
   * @returns {Promise<void>} Resolves once the request finishes and onSuccess has been invoked.
   */
  handleConfirm(gameSlug, character, _token) {
    const fields = { [this.field]: !character[this.field] };

    return RequestStore.mutate({
      componentName: 'SlainConfirmController',
      resource: 'npc',
      method: 'PATCH',
      quantityType: 'single',
      params: { gameSlug, id: character.id },
      body: fields,
      variantName: 'private',
    }).then((response) => {
      if (!response.ok) {
        return;
      }

      RequestStore.purge({ resource: 'npc' });
      this.onSuccess();
    });
  }
}
