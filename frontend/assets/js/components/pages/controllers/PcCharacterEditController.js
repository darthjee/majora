import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import PcCharacterController from './PcCharacterController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug and character id from a PC character edit hash.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Character route params.
 */
export function getPcCharacterEditParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/pcs/:character_id/edit', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

/**
 * Controller for the PC character edit page.
 */
export default class PcCharacterEditController extends BasePageController {
  /**
   * Create a PC character edit controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GenericClient|null} client - Client override, used for hash resolution.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    setFieldErrors = () => {},
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
    this.loadController = new PcCharacterController(
      setCharacter,
      setLoading,
      setError,
      this.client,
      getPcCharacterEditParamsFromHash,
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
   *   (`name`, `avatar_url`, `character_class`, `level`, `public_description`, `private_description`).
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleSubmit(gameSlug, characterId, fields) {
    const token = AuthStorage.getToken();

    try {
      const response = await this.characterClient.updatePc(gameSlug, characterId, token, fields);

      await this.#handleResponse(response, gameSlug, characterId);
    } catch {
      this.setError('Unable to save character.');
    }
  }

  /**
   * Handle the edit form submission: prevent the default browser submit,
   * reset the page status/errors, build the fields payload, and delegate
   * to {@link PcCharacterEditController#handleSubmit}.
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {{name: string, avatarUrl: string, characterClass: string,
   *   level: string, description: string, privateDescription: string}} formValues - Raw form field values.
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
      avatar_url: formValues.avatarUrl,
      character_class: formValues.characterClass,
      level: formValues.level,
      public_description: formValues.description,
      private_description: formValues.privateDescription,
    });
  }

  async #handleResponse(response, gameSlug, characterId) {
    if (response.ok) {
      this.#redirectToShow(gameSlug, characterId);
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      this.setFieldErrors(errors);
      return;
    }

    this.setError('Unable to save character.');
  }

  #redirectToShow(gameSlug, characterId) {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.hash = `/games/${gameSlug}/pcs/${characterId}`;
  }

  /**
   * Apply a loaded character to the edit page, either redirecting away
   * (when the character is not editable) or seeding the form fields.
   *
   * @param {object|null} character - Loaded character, or null while still loading.
   * @param {string} gameSlug - Game slug, used to build the redirect hash.
   * @param {string|number} characterId - Character id, used to build the redirect hash.
   * @param {{setName: Function, setAvatarUrl: Function, setCharacterClass: Function,
   *   setLevel: Function, setDescription: Function, setPrivateDescription: Function}} setters - Form field setters.
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
      setters.setAvatarUrl(fields.avatar_url);
      setters.setCharacterClass(fields.character_class);
      setters.setLevel(fields.level);
      setters.setDescription(fields.public_description);
      setters.setPrivateDescription(fields.private_description);
    }
  }
}

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
      avatar_url: character.avatar_url ?? '',
      character_class: character.character_class ?? '',
      level: character.level ?? '',
      public_description: character.public_description ?? '',
      private_description: character.private_description ?? '',
    },
  };
}
