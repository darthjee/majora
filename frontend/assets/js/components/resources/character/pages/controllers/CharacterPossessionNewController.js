import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the PC/NPC possession creation page (issue #1076), shared by both kinds and
 * parameterized by `characterKind`, mirroring `CharacterItemNewController` exactly: creates a
 * `GamePossession` + `CharacterPossession` together in one call
 * (`regular.create_update` on `game_pc_possession`/`game_npc_possession`), then uploads the photo
 * directly onto the newly-created `GamePossession` (unlike `CharacterItemNewController`, the
 * possession photo-upload path is unconditionally game-owned — see `possessionConfig.js` — so no
 * `kind: 'game'` param is needed for that step, only for the initial `POST.collection` create).
 */
export default class CharacterPossessionNewController extends BasePageController {
  /**
   * Extract game slug/character id from a possession creation hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string}} Extracted route params.
   */
  static getParamsFromPossessionNewHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/possessions/new`, hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create a character possession new controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {UploadClient|null} [uploadClient] - Upload client override.
   */
  constructor(characterKind, setError, setFieldErrors = Noop.noop, uploadClient = null) {
    super();
    this.characterKind = characterKind;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.photoUploadSaga = new PhotoUploadSaga(uploadClient);
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may create possessions
   *   for this character (`can_create_possession`) and redirects to the possessions list when
   *   they cannot, mirroring `CharacterItemNewController#buildEffect`'s redirect pattern.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const { game_slug: gameSlug, character_id: characterId } = CharacterPossessionNewController
        .getParamsFromPossessionNewHash(this.characterKind, hash);

      AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug, characterId))
        .catch(() => this.#redirectToPossessions(gameSlug, characterId));
    };
  }

  /**
   * Submit the new possession form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} so the possession collection's cached
   *   `GET` data is purged on success. On success, redirects immediately to the possessions list
   *   when no photo was picked, or runs the photo upload saga step first, against the created
   *   possession's underlying `game_possession_id`, when `formValues.photoFile` is set. On a 400
   *   response, sets field errors. On any other failure, sets the general error status.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {{name: string, description: string, hidden: boolean, photoFile: File|null}} formValues -
   *   Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function, setGamePossessionId: Function}} setters -
   *   Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, characterId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'CharacterPossessionNewController',
        resource: 'possession',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug, kind: this.characterKind, id: characterId },
        body: {
          name: formValues.name,
          description: formValues.description,
          hidden: formValues.hidden,
        },
      });

      await this.#handleResponse(response, gameSlug, characterId, formValues.photoFile, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Retry the photo upload saga step for an already-created possession.
   *
   * @description Re-invokes the same upload-only path submitForm runs after possession creation,
   *   without creating a new possession. Used by the "retry" action of the photo-upload-failed
   *   UI state.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {number|string} gamePossessionId - Already-created possession's underlying
   *   `GamePossession` id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setGamePossessionId: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(gameSlug, characterId, gamePossessionId, photoFile, setters) {
    return this.#uploadPhoto(gameSlug, characterId, gamePossessionId, photoFile, setters);
  }

  #redirectIfNotAllowed(permissions, gameSlug, characterId) {
    if (!permissions.can_create_possession) {
      this.#redirectToPossessions(gameSlug, characterId);
    }
  }

  #redirectToPossessions(gameSlug, characterId) {
    this.redirectTo(`/games/${gameSlug}/${this.characterKind}/${characterId}/possessions`);
  }

  async #handleResponse(response, gameSlug, characterId, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(gameSlug, characterId, data.game_possession_id, photoFile, setters);
        return;
      }

      this.#redirectToPossessions(gameSlug, characterId);
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

  async #uploadPhoto(gameSlug, characterId, gamePossessionId, photoFile, setters) {
    const token = AuthStorage.getToken();
    // Targets the newly-created `GamePossession` directly — the possession photo-upload path is
    // unconditionally game-owned (see `possessionConfig.js`), so no `kind` param is needed here.
    const uploadPath = await RequestStore.resolvePath({
      resource: 'possession', method: 'POST', quantityType: 'single', params: { gameSlug, id: gamePossessionId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before redirecting, so the possessions list's own `RequestStore.ensure` GET
      // (triggered by the redirect) doesn't re-serve the pre-upload cached collection.
      RequestStore.purge({ resource: 'possession' });
      this.#redirectToPossessions(gameSlug, characterId);
      return;
    }

    setters.setGamePossessionId(gamePossessionId);
    setters.setStatus('photo-upload-failed');
  }
}
