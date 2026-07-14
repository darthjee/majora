import CharacterClient from '../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

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
   */
  constructor(setError, setFieldErrors = Noop.noop, characterClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may
   *   edit the game and redirects to the NPCs index when they cannot.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const gameSlug = GameNpcNewController.getGameSlugFromNpcNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToNpcs(gameSlug));
    };
  }

  /**
   * Submit the new NPC form.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a POST request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   hidden: boolean, money: string, allegiance: string, publicAllegiance: string}} formValues - Raw
   *   form field values.
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
      const response = await this.characterClient.createNpc(gameSlug, token, {
        name: formValues.name,
        role: formValues.role,
        public_description: formValues.description,
        private_description: formValues.privateDescription,
        hidden: formValues.hidden,
        money: parseInt(formValues.money, 10),
        allegiance: formValues.allegiance,
        public_allegiance: formValues.publicAllegiance,
      });

      await this.#handleResponse(response, gameSlug, setters);
    } catch {
      setters.setStatus('error');
    }
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

  async #handleResponse(response, gameSlug, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/npcs/${data.id}`;
      }
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
