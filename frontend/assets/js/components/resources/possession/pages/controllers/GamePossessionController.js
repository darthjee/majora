import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game possession detail page (issue #1074), mirroring `GameItemController`
 * minus the "Give Item"/acquisition wiring (character ownership is tracked separately in #1076).
 *
 * @description Fetches the `GamePossession` through `RequestStore.ensure({resource: 'possession',
 *   quantityType: 'single', params: {gameSlug, kind: 'game', id}})`, which internally resolves the
 *   requester's game-level edit permission (via `RequestPermissionResolvers`) to pick between the full,
 *   hidden-inclusive `possessions/:id/full.json` and the player-facing `possessions/:id.json`,
 *   fail-closed on a rejected permissions check. Independently derives `canUploadPhoto` from
 *   `AccessStore.ensureGameAccess` (a wider, "who can upload" gate that also includes
 *   `is_player`), run concurrently with the possession fetch rather than chained after it. Also
 *   independently derives `canEdit` from its own `AccessStore.ensureGamePermissions` call
 *   (deduped against `RequestStore`'s own permission resolution by `AccessStore`'s cache),
 *   exposed to gate the show page's Edit button.
 */
export default class GamePossessionController extends BasePageController {
  /**
   * Extract the game slug and possession id from a game possession detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/possessions/:id', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game possession controller.
   *
   * @param {Function} setPossession - Possession setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanEdit - Setter for whether the requester may edit this possession.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client = new GenericClient()) {
    super();
    this.setPossession = setPossession;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanEdit = setCanEdit;
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
      const params = GamePossessionController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load possession.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadPossession(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadPossession(params, safeSet) {
    this.#loadCanUploadPhoto(params.game_slug, safeSet);
    this.#loadCanEdit(params.game_slug, safeSet);

    return this.#fetchPossession(params, safeSet);
  }

  #loadCanEdit(gameSlug, safeSet) {
    return AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => safeSet(this.setCanEdit, canEdit));
  }

  #loadCanUploadPhoto(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => GamePossessionController.#canUploadPhoto(access))
      .catch(() => false)
      .then((canUploadPhoto) => safeSet(this.setCanUploadPhoto, canUploadPhoto));
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  #fetchPossession(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GamePossessionController',
      resource: 'possession',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, kind: 'game', id: params.id },
    })
      .then(({ data }) => safeSet(this.setPossession, data))
      .catch(() => safeSet(this.setError, 'Unable to load possession.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
