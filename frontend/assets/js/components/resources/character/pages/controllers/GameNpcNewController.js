import CharacterClient from '../../../../../client/CharacterClient.js';
import UploadClient from '../../../../../client/UploadClient.js';
import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game NPC creation page.
 */
export default class GameNpcNewController extends BasePageController {
  /**
   * Extract game slug from an NPC creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromNpcNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/npcs/new', 'game_slug', hash);
  }

  /**
   * Create a game NPC new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   * @param {UploadClient|null} [uploadClient] - Upload client override.
   * @param {Function} [setGameType] - Setter for the containing game's currency type,
   *   used so the money-editing modal renders the right denominations. Optional — a
   *   caller that does not need this display concern may omit it.
   * @param {GameClient|null} [gameClient] - Game client override.
   */
  constructor(
    setError, setFieldErrors = Noop.noop, characterClient = null, uploadClient = null,
    setGameType = Noop.noop, gameClient = null,
  ) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.characterClient = characterClient ?? new CharacterClient();
    this.uploadClient = uploadClient ?? new UploadClient();
    this.setGameType = setGameType;
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may
   *   edit the game and redirects to the NPCs index when they cannot, and
   *   fetches the containing game's currency type for the money-editing modal.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const gameSlug = GameNpcNewController.getGameSlugFromNpcNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToNpcs(gameSlug));

      this.fetchGameType(gameSlug, AuthStorage.getToken()).then((gameType) => this.setGameType(gameType));
    };
  }

  /**
   * Fetch the containing game's currency type. Degrades to `'dnd'` when the
   * game fetch fails or the response is not ok, rather than blocking the
   * form.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<string>} Resolves to the game's `game_type`.
   */
  fetchGameType(gameSlug, token) {
    return this.gameClient.fetchGame(gameSlug, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((game) => game?.game_type ?? 'dnd')
      .catch(() => 'dnd');
  }

  /**
   * Submit the new NPC form.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a POST request. On success, redirects immediately
   *   when no photo was picked, or runs the photo upload saga step first when
   *   `formValues.photoFile` is set. On a 400 response, sets field errors. On
   *   any other failure, sets the general error status.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   hidden: boolean, money: string, allegiance: string, publicAllegiance: string,
   *   links: object[], photoFile: File|null}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function, setCharacterId: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.characterClient.createNpc(gameSlug, token, {
        name: formValues.name,
        role: formValues.role,
        public_description: formValues.description,
        private_description: formValues.privateDescription,
        hidden: formValues.hidden,
        money: parseInt(formValues.money, 10),
        allegiance: formValues.allegiance,
        public_allegiance: formValues.publicAllegiance,
        links: formValues.links ?? [],
      });

      await this.#handleResponse(response, gameSlug, formValues.photoFile, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Retry the photo upload saga step for an already-created NPC.
   *
   * @description Re-invokes the same upload-only path submitForm runs after
   *   NPC creation, without creating a new NPC. Used by the "retry" action of
   *   the photo-upload-failed UI state.
   * @param {string} gameSlug - Game slug.
   * @param {number|string} characterId - Already-created NPC id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setCharacterId: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(gameSlug, characterId, photoFile, setters) {
    return this.#uploadPhoto(gameSlug, characterId, photoFile, setters);
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_edit) {
      this.#redirectToNpcs(gameSlug);
    }
  }

  #redirectToNpcs(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/npcs`;
    }
  }

  #redirectToNpc(gameSlug, characterId) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/npcs/${characterId}`;
    }
  }

  async #handleResponse(response, gameSlug, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(gameSlug, data.id, photoFile, setters);
        return;
      }

      this.#redirectToNpc(gameSlug, data.id);
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setStatus('error');
  }

  async #uploadPhoto(gameSlug, characterId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = `/games/${gameSlug}/npcs/${characterId}/photo_upload.json`;

    try {
      const initResponse = await this.uploadClient.initUpload(uploadPath, photoFile.name, token);

      if (!initResponse.ok) {
        this.#failPhotoUpload(characterId, setters);
        return;
      }

      const { upload_id: uploadId, token: uploadToken } = await initResponse.json();
      const submitResponse = await this.uploadClient.submitUpload(uploadId, uploadToken, photoFile);

      if (!submitResponse.ok) {
        this.#failPhotoUpload(characterId, setters);
        return;
      }

      this.#redirectToNpc(gameSlug, characterId);
    } catch {
      this.#failPhotoUpload(characterId, setters);
    }
  }

  #failPhotoUpload(characterId, setters) {
    setters.setCharacterId(characterId);
    setters.setStatus('photo-upload-failed');
  }
}
