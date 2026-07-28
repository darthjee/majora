import RequestStore from '../../../../utils/requests/RequestStore.js';

/**
 * Shared mark-not-ready-then-delete saga step: the two-step photo removal flow (`PATCH
 * {ready: false}` then `DELETE`), used via composition by any controller that needs to
 * permanently delete an already-uploaded photo (e.g. `BaseCharacterPhotosController`), mirroring
 * `PhotoUploadSaga`'s two-step shape but composing two `RequestStore.mutate` calls instead of
 * wrapping `UploadClient`.
 */
export default class PhotoDeleteSaga {
  /**
   * Run the two-step delete flow against an already-uploaded photo: first mark it not-ready
   * (`PATCH {ready: false}`), then permanently delete it (`DELETE`). The second step is only
   * attempted when the first one succeeds.
   *
   * @param {string} resource - Resource name the photo belongs to (`'pc'` or `'npc'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|number} photoId - Id of the photo to delete.
   * @returns {Promise<boolean>} Resolves to whether the deletion succeeded.
   */
  async run(resource, gameSlug, characterId, photoId) {
    const params = { gameSlug, id: characterId, photoId };

    try {
      const markResponse = await RequestStore.mutate({
        componentName: 'PhotoDeleteSaga',
        resource,
        method: 'PATCH',
        quantityType: 'photoDelete',
        params,
        body: { ready: false },
      });

      if (!markResponse.ok) return false;

      const deleteResponse = await RequestStore.mutate({
        componentName: 'PhotoDeleteSaga',
        resource,
        method: 'DELETE',
        quantityType: 'photoDelete',
        params,
      });

      return deleteResponse.ok;
    } catch {
      return false;
    }
  }
}
