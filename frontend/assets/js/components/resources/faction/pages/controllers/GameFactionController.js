import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game faction detail page (issue #812), mirroring `GamePossessionController`/
 * `GameItemController`.
 *
 * @description Fetches the `Faction` through `RequestStore.ensure({resource: 'faction',
 *   quantityType: 'single', params: {gameSlug, id}})` — `faction` has no hidden concept, so
 *   `regular`/`private` always resolve to the same path, unlike `item`/`possession`.
 *   Independently derives `canUploadPhoto` from `AccessStore.ensureGameAccess` (a wider, "who
 *   can upload" gate that also includes `is_player`), run concurrently with the faction fetch
 *   rather than chained after it. Also independently derives `canEdit` from its own
 *   `AccessStore.ensureGamePermissions` call (deduped against `RequestStore`'s own permission
 *   resolution by `AccessStore`'s cache), exposed to gate the show page's Edit button — `can_edit`
 *   here is the real DM/staff-only permission (per the update-permission correction documented in
 *   `docs/agents/plans/812-add-factions/plan.md`'s "Shared contracts" section), unlike
 *   `canUploadPhoto`'s broader "any player" gate.
 */
export default class GameFactionController extends BasePageController {
  /**
   * Extract the game slug and faction id from a game faction detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/factions/:id', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game faction controller.
   *
   * @param {Function} setFaction - Faction setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanEdit - Setter for whether the requester may edit this faction.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setFaction, setLoading, setError, setCanEdit, setCanUploadPhoto, client = new GenericClient()) {
    super();
    this.setFaction = setFaction;
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
      const params = GameFactionController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load faction.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadFaction(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadFaction(params, safeSet) {
    this.#loadCanUploadPhoto(params.game_slug, safeSet);
    this.#loadCanEdit(params.game_slug, safeSet);

    return this.#fetchFaction(params, safeSet);
  }

  #loadCanEdit(gameSlug, safeSet) {
    return AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => safeSet(this.setCanEdit, canEdit));
  }

  #loadCanUploadPhoto(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => GameFactionController.#canUploadPhoto(access))
      .catch(() => false)
      .then((canUploadPhoto) => safeSet(this.setCanUploadPhoto, canUploadPhoto));
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  #fetchFaction(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameFactionController',
      resource: 'faction',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.id },
    })
      .then(({ data }) => safeSet(this.setFaction, data))
      .catch(() => safeSet(this.setError, 'Unable to load faction.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
