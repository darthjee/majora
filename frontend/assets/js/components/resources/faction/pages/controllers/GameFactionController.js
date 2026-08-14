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
 *   `AccessStore.ensureFactionPermissions` call (resource-specific, backed by
 *   `/permissions/game_faction.json` — issue #1099), exposed to gate the show page's Edit
 *   button — `can_edit` grants admin/dm as always, plus staff/player (per issue #1099), unlike
 *   `canUploadPhoto`'s broader "any player" gate. `canRecruitHidden` (issue #943) is derived from
 *   the same `AccessStore.ensureGameAccess` call as `canUploadPhoto` (superuser/dm, dropping
 *   player/staff — mirroring `GameDocumentController`'s own `canGiveHidden`, fixed in #833/#1117), gating
 *   which acquire-endpoint variant the recruit modal submits through — a hidden character can only
 *   be recruited via the DM/admin-only `/acquire/all.json` variant.
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
   * @param {Function} setCanRecruitHidden - Setter for whether the requester may recruit a
   *   hidden character into this faction (issue #943, superuser/dm), gating the recruit
   *   modal's acquire-endpoint variant.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(
    setFaction, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanRecruitHidden,
    client = new GenericClient(),
  ) {
    super();
    this.setFaction = setFaction;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanEdit = setCanEdit;
    this.setCanUploadPhoto = setCanUploadPhoto;
    this.setCanRecruitHidden = setCanRecruitHidden;
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
    return AccessStore.ensureFactionPermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => safeSet(this.setCanEdit, canEdit));
  }

  #loadCanUploadPhoto(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => {
        safeSet(this.setCanUploadPhoto, GameFactionController.#canUploadPhoto(access));
        safeSet(this.setCanRecruitHidden, GameFactionController.#canRecruitHidden(access));
      })
      .catch(() => {
        safeSet(this.setCanUploadPhoto, false);
        safeSet(this.setCanRecruitHidden, false);
      });
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  static #canRecruitHidden(access) {
    return Boolean(access.is_superuser || access.is_dm);
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
