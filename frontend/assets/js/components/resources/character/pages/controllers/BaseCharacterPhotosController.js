import GenericClient from '../../../../../client/GenericClient.js';
import CharacterClient from '../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Base controller for character photos index pages (PC and NPC).
 *
 * @description Holds all shared logic for NPC and PC character photos pages.
 *   Subclasses supply the type-specific hash param extractor and `characterKind`
 *   (`'pcs'` or `'npcs'`), used both as the URL segment and to build the correct
 *   {@link CharacterClient} calls.
 */
export default class BaseCharacterPhotosController extends BasePageController {
  /**
   * Create a base character photos controller.
   *
   * @param {object} setters - Page state setters.
   * @param {Function} setters.setPhotos - Photos setter.
   * @param {Function} setters.setPagination - Pagination setter.
   * @param {Function} setters.setCharacter - Character setter, merged with can_edit/is_player/is_staff
   *   for the upload button gate.
   * @param {Function} setters.setLoading - Loading setter.
   * @param {Function} setters.setError - Error setter.
   * @param {Function} getParamsFromHash - Hash param extractor returning `game_slug`/`character_id`.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {GenericClient|null} [client] - Client override.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setters,
    getParamsFromHash,
    characterKind,
    client = null,
    characterClient = null,
  ) {
    super();
    const { setPhotos, setPagination, setCharacter, setLoading, setError } = setters;
    this.setPhotos = setPhotos;
    this.setPagination = setPagination;
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.getParamsFromHash = getParamsFromHash;
    this.characterKind = characterKind;
    this.client = client ?? new GenericClient();
    this.characterClient = characterClient ?? new CharacterClient();
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
      const { game_slug: gameSlug, character_id: characterId } =
        this.getParamsFromHash(this.client.currentHash());

      if (!gameSlug || !characterId) {
        safeSet(this.setError, 'Unable to load photos.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchPhotos(gameSlug, characterId, safeSet);
        this.#fetchCharacter(gameSlug, characterId, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Marks a photo as the character's profile photo, then refreshes the character state
   * so `can_edit` and `profile_photo_id` reflect the change.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|number} photoId - Id of the photo to mark as profile photo.
   * @returns {Promise<void>} Resolves once the update (and character refresh) settle,
   *   rejects when the update request itself fails.
   */
  setProfilePhoto(gameSlug, characterId, photoId) {
    const token = AuthStorage.getToken();
    const safeSet = (setter, value) => setter(value);

    return this.characterClient.setPhotoRoles(this.characterKind, gameSlug, characterId, photoId, token, ['profile'])
      .then(() => this.#fetchCharacter(gameSlug, characterId, safeSet));
  }

  #fetchPhotos(gameSlug, characterId, safeSet) {
    this.client.fetchIndex(`/games/${gameSlug}/${this.characterKind}/${characterId}/photos.json`)
      .then(({ data, pagination }) => {
        safeSet(this.setPhotos, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load photos.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchCharacter(gameSlug, characterId, safeSet) {
    const token = AuthStorage.getToken();

    return this.characterClient.fetchCharacter(this.characterKind, gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((character) => this.#mergeAccess(gameSlug, characterId, character, safeSet))
      .catch(() => safeSet(this.setCharacter, { can_edit: false }));
  }

  #mergeAccess(gameSlug, characterId, character, safeSet) {
    if (!character) {
      safeSet(this.setCharacter, { can_edit: false });
      return Promise.resolve();
    }

    return Promise.all([
      AccessStore.ensureCharacterAccess(this.characterKind, gameSlug, characterId),
      AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId),
    ]).then(([access, permissions]) => safeSet(this.setCharacter, {
      ...character,
      ...permissions,
      is_player: access.is_player,
      is_staff: Boolean(access.is_staff),
    }));
  }
}
