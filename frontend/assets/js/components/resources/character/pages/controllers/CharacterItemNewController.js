import CharacterClient from '../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the PC/NPC item creation page (issue #714), shared by both kinds and
 * parameterized by `characterKind`, following `CharacterItemsHelper`'s existing PC/NPC-sharing
 * precedent.
 */
export default class CharacterItemNewController extends BasePageController {
  /**
   * Extract game slug/character id from an item creation hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string}} Extracted route params.
   */
  static getParamsFromItemNewHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/items/new`, hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create a character item new controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(characterKind, setError, setFieldErrors = Noop.noop, characterClient = null) {
    super();
    this.characterKind = characterKind;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may create items for
   *   this character (`can_create_item`) and redirects to the items list when they cannot,
   *   mirroring `GameNpcNewController#buildEffect`'s `can_edit` redirect pattern.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const { game_slug: gameSlug, character_id: characterId } = CharacterItemNewController
        .getParamsFromItemNewHash(this.characterKind, hash);

      AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug, characterId))
        .catch(() => this.#redirectToItems(gameSlug, characterId));
    };
  }

  /**
   * Submit the new item form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request, then redirects to the items list on success (there is no per-item detail
   *   page to redirect to), sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {{name: string, description: string, hidden: boolean}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, characterId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.characterClient.createItem(this.characterKind, gameSlug, characterId, token, {
        name: formValues.name,
        description: formValues.description,
        hidden: formValues.hidden,
      });

      await this.#handleResponse(response, gameSlug, characterId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #redirectIfNotAllowed(permissions, gameSlug, characterId) {
    if (!permissions.can_create_item) {
      this.#redirectToItems(gameSlug, characterId);
    }
  }

  #redirectToItems(gameSlug, characterId) {
    this.redirectTo(`/games/${gameSlug}/${this.characterKind}/${characterId}/items`);
  }

  async #handleResponse(response, gameSlug, characterId, setters) {
    if (response.status === 201) {
      this.#redirectToItems(gameSlug, characterId);
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
