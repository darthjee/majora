import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';

/**
 * Decide whether a loaded character should redirect away from the edit page
 * (when not editable), or be used to seed the edit form fields.
 *
 * @param {object|null} character - Loaded character, or null while still loading.
 * @returns {{redirect: boolean, fields: object|null}} Decision and seed fields.
 */
export function resolveLoadedCharacter(character) {
  if (!character) {
    return { redirect: false, fields: null };
  }

  if (!character.can_edit) {
    return { redirect: true, fields: null };
  }

  return {
    redirect: false,
    fields: {
      name: character.name ?? '',
      role: character.role ?? '',
      public_description: character.public_description ?? '',
      private_description: character.private_description ?? '',
    },
  };
}

/**
 * Base controller for character edit pages.
 *
 * @description Holds all shared logic for NPC and PC character edit pages.
 *   Subclasses supply the type-specific load controller class, route segment,
 *   and API update method name.
 */
export default class BaseCharacterEditController extends BasePageController {
  /**
   * Create a base character edit controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {Function} loadControllerClass - Load controller class constructor
   *   (NpcCharacterController or PcCharacterController).
   * @param {Function} getParamsFromHash - Hash param extractor for the load controller.
   * @param {string} routeSegment - URL segment for this character type ('npcs' or 'pcs').
   * @param {string} updateMethod - Character client update method ('updateNpc' or 'updatePc').
   * @param {GenericClient|null} [client] - Client override, used for hash resolution.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    setFieldErrors = () => {},
    loadControllerClass,
    getParamsFromHash,
    routeSegment,
    updateMethod,
    client = null,
    characterClient = null,
  ) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.client = client ?? new GenericClient();
    this.characterClient = characterClient ?? new CharacterClient();
    this.routeSegment = routeSegment;
    this.updateMethod = updateMethod;
    this.loadController = new loadControllerClass(
      setCharacter,
      setLoading,
      setError,
      this.client,
      getParamsFromHash,
      this.characterClient,
    );
  }

  /**
   * Build the page loading effect, reusing the same authenticated fetch
   * logic as the show page.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return this.loadController.buildEffect();
  }

  /**
   * Submit a partial update for the character.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {object} fields - Fields to update
   *   (`name`, `role`, `public_description`, `private_description`).
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleSubmit(gameSlug, characterId, fields, setters) {
    const token = AuthStorage.getToken();

    try {
      const response = await this.characterClient[this.updateMethod](
        gameSlug, characterId, token, fields,
      );

      await this.#handleResponse(response, gameSlug, characterId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Handle the edit form submission: prevent the default browser submit,
   * reset the page status/errors, build the fields payload, and delegate
   * to {@link BaseCharacterEditController#handleSubmit}.
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {{name: string, role: string,
   *   description: string, privateDescription: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, characterId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    return this.handleSubmit(gameSlug, characterId, {
      name: formValues.name,
      role: formValues.role,
      public_description: formValues.description,
      private_description: formValues.privateDescription,
    }, setters);
  }

  /**
   * Apply a loaded character to the edit page, either redirecting away
   * (when the character is not editable) or seeding the form fields.
   *
   * @param {object|null} character - Loaded character, or null while still loading.
   * @param {string} gameSlug - Game slug, used to build the redirect hash.
   * @param {string|number} characterId - Character id, used to build the redirect hash.
   * @param {{setName: Function, setRole: Function,
   *   setDescription: Function, setPrivateDescription: Function}} setters - Form field setters.
   * @returns {void}
   */
  applyLoadedCharacter(character, gameSlug, characterId, setters) {
    const { redirect, fields } = resolveLoadedCharacter(character);

    if (redirect) {
      this.#redirectToShow(gameSlug, characterId);
      return;
    }

    if (fields) {
      setters.setName(fields.name);
      setters.setRole(fields.role);
      setters.setDescription(fields.public_description);
      setters.setPrivateDescription(fields.private_description);
    }
  }

  async #handleResponse(response, gameSlug, characterId, setters) {
    if (response.ok) {
      this.#redirectToShow(gameSlug, characterId);
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

  #redirectToShow(gameSlug, characterId) {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.hash = `/games/${gameSlug}/${this.routeSegment}/${characterId}`;
  }
}
