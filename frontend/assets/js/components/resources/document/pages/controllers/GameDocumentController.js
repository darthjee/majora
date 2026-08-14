import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game document detail page (issue #758, photo upload gating added in #727,
 * `canGiveHidden` derivation fixed in #833, dropped `is_staff` in #1117).
 *
 * @description Fetches the `GameDocument` through `RequestStore.ensure({resource: 'document',
 *   quantityType: 'single', params: {gameSlug, kind: 'game', id}})`, which internally resolves
 *   the requester's game-level edit permission (via `RequestPermissionResolvers`) to pick
 *   between the full, hidden-inclusive `documents/:id/full.json` and the player-facing
 *   `documents/:id.json`, fail-closed on a rejected permissions check. Independently derives both
 *   `canUploadPhoto` and `canGiveHidden` from a single shared `AccessStore.ensureGameAccess` call,
 *   run concurrently with the document fetch rather than chained after it, mirroring
 *   `GameItemController`'s own `#loadCanUploadPhoto`. This page's Edit/file-upload/Give-Document
 *   buttons all reuse the same `canUploadPhoto` flag, since there is no separate general "edit"
 *   permission for documents; `canGiveHidden` (superuser/dm, dropping `is_player`/`is_staff`) instead
 *   gates which acquire-endpoint variant the give-document modal submits through — a hidden
 *   `GameDocument` can only be given via the DM/admin-only `/acquire/all.json` variant (issue
 *   #833, replacing the previous, too-broad `AccessStore.ensureDocumentPermissions().can_edit`
 *   derivation, which had no other consumer on this page).
 */
export default class GameDocumentController extends BasePageController {
  /**
   * Extract the game slug and document id from a game document detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/documents/:id', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game document controller.
   *
   * @param {Function} setDocument - Document setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {Function} setCanGiveHidden - Setter for whether the requester may give this document
   *   even when hidden (issue #833, superuser/dm), gating the give-document modal's
   *   hidden-document acquire variant.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setDocument, setLoading, setError, setCanUploadPhoto, setCanGiveHidden, client = new GenericClient()) {
    super();
    this.setDocument = setDocument;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanUploadPhoto = setCanUploadPhoto;
    this.setCanGiveHidden = setCanGiveHidden;
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
      const params = GameDocumentController.getParamsFromHash(this.client.currentHash());

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
    this.#loadAccessFlags(params.game_slug, safeSet);

    return RequestStore.ensure({
      componentName: 'GameDocumentController',
      resource: 'document',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, kind: 'game', id: params.id },
    })
      .then(({ data }) => safeSet(this.setDocument, data))
      .catch(() => safeSet(this.setError, 'Unable to load document.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #loadAccessFlags(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => {
        safeSet(this.setCanUploadPhoto, GameDocumentController.#canUploadPhoto(access));
        safeSet(this.setCanGiveHidden, GameDocumentController.#canGiveHidden(access));
      })
      .catch(() => {
        safeSet(this.setCanUploadPhoto, false);
        safeSet(this.setCanGiveHidden, false);
      });
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  static #canGiveHidden(access) {
    return Boolean(access.is_superuser || access.is_dm);
  }
}
