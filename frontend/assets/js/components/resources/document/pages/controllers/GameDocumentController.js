import GenericClient from '../../../../../client/GenericClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game document detail page (issue #758).
 *
 * @description Fetches the `GameDocument` through `RequestStore.ensure({resource: 'document',
 *   quantityType: 'single', params: {gameSlug, kind: 'game', id}})`, which internally resolves
 *   the requester's game-level edit permission (via `RequestPermissionResolvers`) to pick
 *   between the full, hidden-inclusive `documents/:id/full.json` and the player-facing
 *   `documents/:id.json`, fail-closed on a rejected permissions check. Unlike `GameItemController`,
 *   this page has no edit button and no photo upload affordance in this issue, so no
 *   `canEdit`/`canUploadPhoto` derivation is needed here.
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
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setDocument, setLoading, setError, client = new GenericClient()) {
    super();
    this.setDocument = setDocument;
    this.setLoading = setLoading;
    this.setError = setError;
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
}
