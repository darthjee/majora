import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game-level possession creation page (issue #1074), mirroring
 * `GameItemNewController` — creates a bare `GamePossession` with no owning character (out of
 * scope, tracked in #1076).
 */
export default class GamePossessionNewController extends BasePageController {
  /**
   * Extract the game slug from a game possession creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromPossessionNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/possessions/new', 'game_slug', hash);
  }

  /**
   * Create a game possession new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {UploadClient|null} [uploadClient] - Upload client override.
   */
  constructor(setError, setFieldErrors = Noop.noop, uploadClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.photoUploadSaga = new PhotoUploadSaga(uploadClient);
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may create possessions
   *   for this game (`can_create_possession`) and redirects to the possessions list when they
   *   cannot, mirroring `GameItemNewController#buildEffect`'s `can_create_item` redirect pattern.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const gameSlug = GamePossessionNewController.getGameSlugFromPossessionNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToPossessions(gameSlug));
    };
  }

  /**
   * Submit the new possession form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (so the possession collection's cached
   *   `GET` data is purged on success). On success, redirects immediately to the possessions list
   *   when no photo was picked, or runs the photo upload saga step first, against the created
   *   possession's `id`, when `formValues.photoFile` is set. On a 400 response, sets field
   *   errors. On any other failure, sets the general error status.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, description: string, hidden: boolean, photoFile: File|null}} formValues -
   *   Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function, setGamePossessionId: Function}} setters -
   *   Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'GamePossessionNewController',
        resource: 'possession',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug, kind: 'game' },
        body: {
          name: formValues.name,
          description: formValues.description,
          hidden: formValues.hidden,
        },
      });

      await this.#handleResponse(response, gameSlug, formValues.photoFile, setters);
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
   * @param {number|string} gamePossessionId - Already-created possession's id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setGamePossessionId: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(gameSlug, gamePossessionId, photoFile, setters) {
    return this.#uploadPhoto(gameSlug, gamePossessionId, photoFile, setters);
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_create_possession) {
      this.#redirectToPossessions(gameSlug);
    }
  }

  #redirectToPossessions(gameSlug) {
    this.redirectTo(`/games/${gameSlug}/possessions`);
  }

  async #handleResponse(response, gameSlug, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(gameSlug, data.id, photoFile, setters);
        return;
      }

      this.#redirectToPossessions(gameSlug);
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

  async #uploadPhoto(gameSlug, gamePossessionId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = await RequestStore.resolvePath({
      resource: 'possession', method: 'POST', quantityType: 'single', params: { gameSlug, id: gamePossessionId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before redirecting, so the possessions list's own `RequestStore.ensure` GET
      // (triggered by the redirect) doesn't re-serve the pre-upload cached collection.
      RequestStore.purge({ resource: 'possession' });
      this.#redirectToPossessions(gameSlug);
      return;
    }

    setters.setGamePossessionId(gamePossessionId);
    setters.setStatus('photo-upload-failed');
  }
}
