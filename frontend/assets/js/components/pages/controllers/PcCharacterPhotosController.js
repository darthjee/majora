import GenericClient from '../../../client/GenericClient.js';
import CharacterClient from '../../../client/CharacterClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import Noop from '../../../utils/Noop.js';

/**
 * Extract game slug and character id from the PC character photos hash route.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Route params with game_slug and character_id.
 */
export function getPcCharacterPhotosParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/pcs/:character_id/photos', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

/**
 * Controller for the PC character photos index page.
 */
export default class PcCharacterPhotosController extends BasePageController {
  /**
   * Create a PC character photos controller.
   *
   * @param {Function} setPhotos - Photos setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setCharacter - Character setter, merged with can_edit for the upload button gate.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {CharacterClient|null} characterClient - Character client override.
   */
  constructor(setPhotos, setPagination, setCharacter, setLoading, setError, client = null, characterClient = null) {
    super();
    this.setPhotos = setPhotos;
    this.setPagination = setPagination;
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
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
        getPcCharacterPhotosParamsFromHash(this.client.currentHash());

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
   * @returns {Promise<void>} Resolves once the update (and character refresh) settle.
   */
  setProfilePhoto(gameSlug, characterId, photoId) {
    const token = AuthStorage.getToken();
    const safeSet = (setter, value) => setter(value);

    return this.characterClient.setPcPhotoRoles(gameSlug, characterId, photoId, token, ['profile'])
      .then(() => this.#fetchCharacter(gameSlug, characterId, safeSet))
      .catch(Noop.noop);
  }

  #fetchPhotos(gameSlug, characterId, safeSet) {
    this.client.fetchIndex(`/games/${gameSlug}/pcs/${characterId}/photos.json`)
      .then(({ data, pagination }) => {
        safeSet(this.setPhotos, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load photos.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchCharacter(gameSlug, characterId, safeSet) {
    const token = AuthStorage.getToken();

    return this.characterClient.fetchPc(gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((character) => this.#mergeAccess(gameSlug, characterId, token, character, safeSet))
      .catch(() => safeSet(this.setCharacter, { can_edit: false }));
  }

  #mergeAccess(gameSlug, characterId, token, character, safeSet) {
    if (!character) {
      safeSet(this.setCharacter, { can_edit: false });
      return Promise.resolve();
    }

    return this.characterClient.fetchPcAccess(gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : { can_edit: false }))
      .then((access) => safeSet(this.setCharacter, { ...character, ...access }))
      .catch(() => safeSet(this.setCharacter, { ...character, can_edit: false }));
  }
}
