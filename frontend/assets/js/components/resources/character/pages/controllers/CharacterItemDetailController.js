import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the PC/NPC item detail page (issue #724, photo upload gating added in #750),
 * shared by `PcCharacterItem` and `NpcCharacterItem` via the `characterKind` constructor
 * argument, mirroring `GameItemController`'s single-object `client.fetch(path)` usage but gated
 * on the requester's character-level edit permission (the same source `buildFetchCharacterItems`
 * in `listTypeConfig.js` uses) instead of the game-level one, to pick between the full,
 * hidden-inclusive `items/:id/all.json` and the player-facing `items/:id.json`, fail-closed on
 * a rejected permissions check. Also reads `can_upload_item_photo` off that same
 * `AccessStore.ensureCharacterPermissions` resolution (no second network call needed), unlike
 * `GameItemController` which derives its upload gate from a separate `ensureGameAccess` check.
 */
export default class CharacterItemDetailController extends BasePageController {
  /**
   * Extract the game slug, character id, and item id from a character item detail hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `character_id`, `id`).
   */
  static getParamsFromHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/items/:id`,
      hash,
      ['game_slug', 'character_id', 'id'],
    );
  }

  /**
   * Create a character item detail controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {Function} setItem - Item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(characterKind, setItem, setLoading, setError, setCanUploadPhoto, client = new GenericClient()) {
    super();
    this.characterKind = characterKind;
    this.setItem = setItem;
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
      const params = CharacterItemDetailController.getParamsFromHash(
        this.characterKind, this.client.currentHash(),
      );

      if (!params.game_slug || !params.character_id || !params.id) {
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
    return AccessStore.ensureCharacterPermissions(this.characterKind, params.game_slug, params.character_id)
      .then((permissions) => ({
        canEdit: Boolean(permissions.can_edit),
        canUploadPhoto: Boolean(permissions.can_upload_item_photo),
      }))
      .catch(() => ({ canEdit: false, canUploadPhoto: false }))
      .then(({ canEdit, canUploadPhoto }) => {
        safeSet(this.setCanUploadPhoto, canUploadPhoto);

        return this.#fetchItem(params, canEdit, safeSet);
      });
  }

  #fetchItem(params, canEdit, safeSet) {
    const base = `/games/${params.game_slug}/${this.characterKind}/${params.character_id}/items/${params.id}`;
    const path = canEdit ? `${base}/all.json` : `${base}.json`;

    return this.client.fetch(path)
      .then((item) => safeSet(this.setItem, item))
      .catch(() => safeSet(this.setError, 'Unable to load item.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
