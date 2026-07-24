import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game-level document creation page (issue #758) — creates a bare
 * `GameDocument` with no owning `CharacterDocument`. Simpler than `GameItemNewController` — no
 * photo upload at all, so there is no `PhotoUploadSaga`/retry-skip wiring here.
 */
export default class GameDocumentNewController extends BasePageController {
  /**
   * Extract the game slug from a game document creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromDocumentNewHash(hash = '') {
    return BasePageController.extractParam(
      '/games/:game_slug/documents/new', 'game_slug', hash,
    );
  }

  /**
   * Create a game document new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameClient|null} [gameClient] - Game client override.
   */
  constructor(setError, setFieldErrors = Noop.noop, gameClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may create documents
   *   for this game (`can_create_document`) and redirects to the documents list when they
   *   cannot, mirroring `GameItemNewController#buildEffect`'s `can_create_item` redirect
   *   pattern, keyed on `can_create_document` instead.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const gameSlug = GameDocumentNewController.getGameSlugFromDocumentNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToDocuments(gameSlug));
    };
  }

  /**
   * Submit the new document form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request. On success (`201`), redirects immediately to the documents list. On a `400`
   *   response, sets field errors. On any other failure, sets the general error status.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, description: string, hidden: boolean}} formValues - Raw form field
   *   values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
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
      const response = await this.gameClient.createDocument(gameSlug, token, {
        name: formValues.name,
        description: formValues.description,
        hidden: formValues.hidden,
      });

      await this.#handleResponse(response, gameSlug, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_create_document) {
      this.#redirectToDocuments(gameSlug);
    }
  }

  #redirectToDocuments(gameSlug) {
    this.redirectTo(`/games/${gameSlug}/documents`);
  }

  async #handleResponse(response, gameSlug, setters) {
    if (response.status === 201) {
      this.#redirectToDocuments(gameSlug);
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
}
