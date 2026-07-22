import GenericClient from '../../../../../client/GenericClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Base controller for the PC/NPC item edit pages (issue #766), shared by
 * `PcCharacterItemEditController` and `NpcCharacterItemEditController` via the `characterKind`
 * constructor argument, mirroring `BaseCharacterEditController`'s fetch/submit/redirect shape.
 *
 * @description Loads the item through the elevated `.../items/:id/full.json` endpoint (mirroring
 *   `CharacterItemDetailController`'s use of that endpoint for editors), and submits partial
 *   updates (`name`/`description`/`hidden`) through `PATCH .../items/:id.json`, redirecting to the
 *   item's detail page on success, surfacing field errors on 400, or setting a generic error
 *   status otherwise.
 */
export default class BaseCharacterItemEditController extends BasePageController {
  /**
   * Extract the game slug, character id, and item id from a character item edit hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string, id: string}} Route params.
   */
  static getParamsFromHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/items/:id/edit`,
      hash,
      ['game_slug', 'character_id', 'id'],
    );
  }

  /**
   * Create a base character item edit controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {Function} setItem - Item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(characterKind, setItem, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super();
    this.characterKind = characterKind;
    this.setItem = setItem;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.client = client ?? new GenericClient();
  }

  /**
   * Build the page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const params = BaseCharacterItemEditController.getParamsFromHash(
        this.characterKind, this.client.currentHash(),
      );

      if (!params.game_slug || !params.character_id || !params.id) {
        safeSet(this.setError, 'Unable to load item.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadItem(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Apply a loaded item's fields to the edit form's state.
   *
   * @param {object|null} item - Loaded item, or null while still loading.
   * @param {{setName: Function, setDescription: Function, setHidden: Function}} setters - Form
   *   field setters.
   * @returns {void}
   */
  applyLoadedItem(item, setters) {
    if (!item) {
      return;
    }

    setters.setName(item.name);
    setters.setDescription(item.description ?? '');
    setters.setHidden(Boolean(item.hidden));
  }

  /**
   * Submit a partial update for the item.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request, then redirects to the item's detail page on success, sets field errors on
   *   400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {string|number} itemId - Item id.
   * @param {{name: string, description: string, hidden: boolean}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, characterId, itemId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();
    const path = `/games/${gameSlug}/${this.characterKind}/${characterId}/items/${itemId}.json`;

    try {
      const response = await this.client.patchJson(path, token, {
        name: formValues.name,
        description: formValues.description,
        hidden: formValues.hidden,
      });

      await this.#handleResponse(response, gameSlug, characterId, itemId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #loadItem(params, safeSet) {
    const path = `/games/${params.game_slug}/${this.characterKind}/${params.character_id}/items/${params.id}/full.json`;

    return this.client.fetch(path)
      .then((item) => safeSet(this.setItem, item))
      .catch(() => safeSet(this.setError, 'Unable to load item.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, characterId, itemId, setters) {
    if (response.ok) {
      this.redirectTo(`/games/${gameSlug}/${this.characterKind}/${characterId}/items/${itemId}`);
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
