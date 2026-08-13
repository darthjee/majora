import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the PC/NPC possession detail page (issue #1076), shared by `PcCharacterPossession`
 * and `NpcCharacterPossession` via the `characterKind` constructor argument. Fetches the
 * `CharacterPossession` through `RequestStore.ensure({resource: 'possession', quantityType:
 * 'single', params: {gameSlug, kind: characterKind, id: characterId, possessionId}})`, mirroring
 * `CharacterDocumentDetailController`'s `RequestStore`-backed fetch. Unlike
 * `CharacterDocumentDetailController`, this page keeps an Edit button and a photo-replace action,
 * since `GamePossession`'s own fields are editable through it (see the main plan's "Attribute
 * delegation model") — but those actions act on the underlying `GamePossession` directly, gated by
 * *game-level* permissions, so `canEdit`/`canUploadPhoto` are independently derived from
 * `AccessStore.ensureGamePermissions`/`ensureGameAccess`, mirroring `GamePossessionController`
 * exactly rather than `CharacterItemDetailController`'s character-level derivation.
 */
export default class CharacterPossessionDetailController extends BasePageController {
  /**
   * Extract the game slug, character id, and `CharacterPossession` id from a character possession
   * detail hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `character_id`, `id`).
   */
  static getParamsFromHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/possessions/:id`,
      hash,
      ['game_slug', 'character_id', 'id'],
    );
  }

  /**
   * Create a character possession detail controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {Function} setPossession - Possession setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanEdit - Setter for whether the requester may edit the underlying
   *   `GamePossession`.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(characterKind, setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto, client = new GenericClient()) {
    super();
    this.characterKind = characterKind;
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
      const params = CharacterPossessionDetailController.getParamsFromHash(
        this.characterKind, this.client.currentHash(),
      );

      if (!params.game_slug || !params.character_id || !params.id) {
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
      .then((access) => CharacterPossessionDetailController.#canUploadPhoto(access))
      .catch(() => false)
      .then((canUploadPhoto) => safeSet(this.setCanUploadPhoto, canUploadPhoto));
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  #fetchPossession(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'CharacterPossessionDetailController',
      resource: 'possession',
      quantityType: 'single',
      params: {
        gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id, possessionId: params.id,
      },
    })
      .then(({ data }) => safeSet(this.setPossession, data))
      .catch(() => safeSet(this.setError, 'Unable to load possession.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
