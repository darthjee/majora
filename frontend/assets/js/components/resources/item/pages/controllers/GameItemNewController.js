import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game-level item creation page (issue #784) — creates a bare `GameItem`
 * with no owning `CharacterItem`, unlike `CharacterItemNewController`'s PC/NPC counterpart.
 */
export default class GameItemNewController extends BasePageController {
  /**
   * Extract the game slug from a game item creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromItemNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/items/new', 'game_slug', hash);
  }

  /**
   * Create a game item new controller.
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
   * @description Returns a callback that checks whether the current user may create items for
   *   this game (`can_create_item`) and redirects to the items list when they cannot, mirroring
   *   `GameNpcNewController#buildEffect`'s `can_edit` redirect pattern, keyed on `can_create_item`
   *   instead.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const gameSlug = GameItemNewController.getGameSlugFromItemNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToItems(gameSlug));
    };
  }

  /**
   * Submit the new item form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (issue #841, so the item collection's
   *   cached `GET` data is purged on success). On success, redirects immediately to the items list
   *   when no photo was picked, or runs the photo upload saga step first, against the created
   *   item's `id`, when `formValues.photoFile` is set. On a 400 response, sets field errors. On
   *   any other failure, sets the general error status.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, description: string, hidden: boolean, photoFile: File|null}} formValues -
   *   Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function, setGameItemId: Function}} setters - Page
   *   state setters.
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
        componentName: 'GameItemNewController',
        resource: 'item',
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
   * Retry the photo upload saga step for an already-created item.
   *
   * @description Re-invokes the same upload-only path submitForm runs after item creation,
   *   without creating a new item. Used by the "retry" action of the photo-upload-failed UI
   *   state.
   * @param {string} gameSlug - Game slug.
   * @param {number|string} gameItemId - Already-created item's id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setGameItemId: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(gameSlug, gameItemId, photoFile, setters) {
    return this.#uploadPhoto(gameSlug, gameItemId, photoFile, setters);
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_create_item) {
      this.#redirectToItems(gameSlug);
    }
  }

  #redirectToItems(gameSlug) {
    this.redirectTo(`/games/${gameSlug}/items`);
  }

  async #handleResponse(response, gameSlug, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(gameSlug, data.id, photoFile, setters);
        return;
      }

      this.#redirectToItems(gameSlug);
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

  async #uploadPhoto(gameSlug, gameItemId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = await RequestStore.resolvePath({
      resource: 'item', method: 'POST', quantityType: 'single', params: { gameSlug, kind: 'game', id: gameItemId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before redirecting, so the items list's own `RequestStore.ensure` GET (triggered by
      // the redirect) doesn't re-serve the pre-upload cached collection.
      RequestStore.purge({ resource: 'item' });
      this.#redirectToItems(gameSlug);
      return;
    }

    setters.setGameItemId(gameItemId);
    setters.setStatus('photo-upload-failed');
  }
}
