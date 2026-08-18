import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game-level common item creation page (issue #826), mirroring
 * `GamePossessionNewController` — creates a bare `GameCommonItem` with no owning character
 * (`GameCommonItem` has no character-owned family at all).
 */
export default class GameCommonItemNewController extends BasePageController {
  /**
   * Extract the game slug from a game common item creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromCommonItemNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/common_items/new', 'game_slug', hash);
  }

  /**
   * Create a game common item new controller.
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
   * @description Returns a callback that checks whether the current user may create common items
   *   for this game (`can_create_common_item`) and redirects to the common items list when they
   *   cannot, mirroring `GamePossessionNewController#buildEffect`'s `can_create_possession`
   *   redirect pattern.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const gameSlug = GameCommonItemNewController.getGameSlugFromCommonItemNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToCommonItems(gameSlug));
    };
  }

  /**
   * Submit the new common item form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (so the common item collection's cached
   *   `GET` data is purged on success). On success, redirects immediately to the common items
   *   list when no photo was picked, or runs the photo upload saga step first, against the
   *   created common item's `id`, when `formValues.photoFile` is set. On a 400 response, sets
   *   field errors. On any other failure, sets the general error status.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, description: string, price: string|number, category: string,
   *   hidden: boolean, photoFile: File|null}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function, setGameCommonItemId: Function}} setters -
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
        componentName: 'GameCommonItemNewController',
        resource: 'commonItem',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug },
        body: {
          name: formValues.name,
          description: formValues.description,
          price: Number(formValues.price) || 0,
          category: formValues.category,
          hidden: formValues.hidden,
        },
      });

      await this.#handleResponse(response, gameSlug, formValues.photoFile, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Retry the photo upload saga step for an already-created common item.
   *
   * @description Re-invokes the same upload-only path submitForm runs after common item
   *   creation, without creating a new common item. Used by the "retry" action of the
   *   photo-upload-failed UI state.
   * @param {string} gameSlug - Game slug.
   * @param {number|string} gameCommonItemId - Already-created common item's id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setGameCommonItemId: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(gameSlug, gameCommonItemId, photoFile, setters) {
    return this.#uploadPhoto(gameSlug, gameCommonItemId, photoFile, setters);
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_create_common_item) {
      this.#redirectToCommonItems(gameSlug);
    }
  }

  #redirectToCommonItems(gameSlug) {
    this.redirectTo(`/games/${gameSlug}/common_items`);
  }

  async #handleResponse(response, gameSlug, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(gameSlug, data.id, photoFile, setters);
        return;
      }

      this.#redirectToCommonItems(gameSlug);
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

  async #uploadPhoto(gameSlug, gameCommonItemId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = await RequestStore.resolvePath({
      resource: 'commonItem', method: 'POST', quantityType: 'single', params: { gameSlug, id: gameCommonItemId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before redirecting, so the common items list's own `RequestStore.ensure` GET
      // (triggered by the redirect) doesn't re-serve the pre-upload cached collection.
      RequestStore.purge({ resource: 'commonItem' });
      this.#redirectToCommonItems(gameSlug);
      return;
    }

    setters.setGameCommonItemId(gameCommonItemId);
    setters.setStatus('photo-upload-failed');
  }
}
