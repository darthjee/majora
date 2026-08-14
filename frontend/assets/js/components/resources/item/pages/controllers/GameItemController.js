import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game item detail page (issue #724, photo upload gating added in #749,
 * edit button gating added in #782, dropped `is_staff` from `canGiveHidden` in #1117).
 *
 * @description Fetches the `GameItem` through `RequestStore.ensure({resource: 'item',
 *   quantityType: 'single', params: {gameSlug, kind: 'game', id}})`, which internally resolves
 *   the requester's game-level edit permission (via `RequestPermissionResolvers`, the same
 *   `AccessStore.ensureGamePermissions` source `fetchGameItems` in `listTypeConfig.js` uses) to
 *   pick between the full, hidden-inclusive `items/:id/full.json` and the player-facing
 *   `items/:id.json`, fail-closed on a rejected permissions check. Independently derives both
 *   `canUploadPhoto` and `canGiveHidden` from a single shared `AccessStore.ensureGameAccess` call
 *   (a wider, "who can upload" gate that also includes `is_player`, unlike the narrower
 *   `can_edit` used to pick the fetch endpoint), run concurrently with the item fetch rather than
 *   chained after it. `canGiveHidden` (superuser/dm, dropping `is_player`/`is_staff`) gates which
 *   acquire-endpoint variant the give-item modal submits through — a hidden `GameItem` can only
 *   be given via the DM/admin-only variant (issue #833, replacing the previous, too-broad
 *   `canEdit`-driven derivation). Also independently derives `canEdit` from its own
 *   `AccessStore.ensureItemPermissions` call (resource-specific, backed by
 *   `/permissions/game_item.json` — issue #1099), exposed to gate the show page's Edit button.
 */
export default class GameItemController extends BasePageController {
  /**
   * Extract the game slug and item id from a game item detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/items/:id', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game item controller.
   *
   * @param {Function} setItem - Item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanEdit - Setter for whether the requester may edit this item.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {Function} setCanGiveHidden - Setter for whether the requester may give this item even
   *   when hidden (issue #833, superuser/dm), gating the give-item modal's hidden-item acquire
   *   variant.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(
    setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanGiveHidden,
    client = new GenericClient(),
  ) {
    super();
    this.setItem = setItem;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanEdit = setCanEdit;
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
      const params = GameItemController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load item.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadItem(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadItem(params, safeSet) {
    this.#loadAccessFlags(params.game_slug, safeSet);
    this.#loadCanEdit(params.game_slug, safeSet);

    return this.#fetchItem(params, safeSet);
  }

  #loadCanEdit(gameSlug, safeSet) {
    return AccessStore.ensureItemPermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => safeSet(this.setCanEdit, canEdit));
  }

  #loadAccessFlags(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => {
        safeSet(this.setCanUploadPhoto, GameItemController.#canUploadPhoto(access));
        safeSet(this.setCanGiveHidden, GameItemController.#canGiveHidden(access));
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

  #fetchItem(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameItemController',
      resource: 'item',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, kind: 'game', id: params.id },
    })
      .then(({ data }) => safeSet(this.setItem, data))
      .catch(() => safeSet(this.setError, 'Unable to load item.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
