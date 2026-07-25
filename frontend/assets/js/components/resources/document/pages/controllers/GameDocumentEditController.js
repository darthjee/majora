import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game document edit page (issue #727) — photo-upload-only, since no
 * `PATCH .../documents/:id.json` endpoint exists yet (issue #758 scope decision, unchanged by
 * this issue).
 *
 * @description Fetches the `GameDocument` through `RequestStore.ensure({resource: 'document',
 *   quantityType: 'single', params: {gameSlug, kind: 'game', id}})`, the same single-document
 *   fetch `GameDocumentController` uses for the show page — there is nothing DM-only to reveal
 *   here beyond what the show page already fetches, so no separate `full.json` need.
 *   Independently derives `canUploadPhoto` from `AccessStore.ensureGameAccess`, run concurrently
 *   with the document fetch, mirroring `GameDocumentController`'s own `#loadCanUploadPhoto` — the
 *   edit route being reachable by direct URL, not only via the show page's already-gated Edit
 *   button, still needs its own gate for the upload affordance.
 */
export default class GameDocumentEditController extends BasePageController {
  /**
   * Extract the game slug and document id from a game document edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/documents/:id/edit', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game document edit controller.
   *
   * @param {Function} setDocument - Document setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setDocument, setLoading, setError, setCanUploadPhoto, client = new GenericClient()) {
    super();
    this.setDocument = setDocument;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanUploadPhoto = setCanUploadPhoto;
    this.client = client;
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const params = GameDocumentEditController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load document.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadDocument(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadDocument(params, safeSet) {
    this.#loadCanUploadPhoto(params.game_slug, safeSet);

    return RequestStore.ensure({
      componentName: 'GameDocumentEditController',
      resource: 'document',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, kind: 'game', id: params.id },
    })
      .then(({ data }) => safeSet(this.setDocument, data))
      .catch(() => safeSet(this.setError, 'Unable to load document.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #loadCanUploadPhoto(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => GameDocumentEditController.#canUploadPhoto(access))
      .catch(() => false)
      .then((canUploadPhoto) => safeSet(this.setCanUploadPhoto, canUploadPhoto));
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }
}
