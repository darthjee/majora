import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Base controller for character edit pages.
 *
 * @description Holds all shared logic for NPC and PC character edit pages.
 *   Subclasses supply the type-specific load controller class, route segment,
 *   and API update method name.
 */
export default class BaseCharacterEditController extends BasePageController {
  /**
   * Decide whether a loaded character should redirect away from the edit
   * page, because it is missing or not editable.
   *
   * @param {object|null} character - Loaded character, or null while still loading.
   * @returns {boolean} True when the page should redirect away.
   */
  static #shouldRedirect(character) {
    return Boolean(character) && !character.can_edit;
  }

  /**
   * Shape the form-seed fields object from a loaded, editable character.
   *
   * @param {object} character - Loaded, editable character.
   * @returns {object} Seed fields for the edit form.
   */
  static #fieldsFromCharacter(character) {
    return {
      name: character.name ?? '',
      role: character.role ?? '',
      public_description: character.public_description ?? '',
      private_description: character.private_description ?? '',
      money: String(character.money ?? 0),
      allegiance: character.allegiance ?? 'neutral',
      public_allegiance: character.public_allegiance ?? 'neutral',
      links: character.links ?? [],
    };
  }

  /**
   * Maps the edit page's local links state to the wire shape expected by the
   * character update/create endpoints: blank `text` defaults to the link's
   * `url`, `id` is only included for persisted links, and `delete` reflects
   * whether the link was marked for deletion in the modal.
   *
   * @param {object[]} links - Local links state (as edited via LinksEditModal).
   * @returns {object[]} Links payload ready to send to the backend.
   */
  static #linksPayload(links = []) {
    return links.map((link) => {
      const payload = {
        text: link.text?.trim() ? link.text : link.url,
        url: link.url,
        link_type: link.link_type ?? '',
        delete: Boolean(link.delete),
      };

      if (link.id) {
        payload.id = link.id;
      }

      return payload;
    });
  }

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
   * @param {string} routeSegment - URL segment for this character type ('npcs' or 'pcs'),
   *   also used as the `characterKind` passed to {@link CharacterClient#updateCharacter}.
   * @param {GenericClient|null} [client] - Client override, used for hash resolution.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    setFieldErrors = Noop.noop,
    loadControllerClass,
    getParamsFromHash,
    routeSegment,
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
   *   (`name`, `role`, `public_description`, `private_description`, `money`, `links`,
   *   and, for NPCs, `allegiance`/`public_allegiance`).
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleSubmit(gameSlug, characterId, fields, setters) {
    const token = AuthStorage.getToken();

    try {
      const response = await this.characterClient.updateCharacter(
        this.routeSegment, gameSlug, characterId, token, fields,
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
   * @param {{name: string, role: string, description: string,
   *   privateDescription: string, money: string, allegiance: string,
   *   publicAllegiance: string, links: object[]}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, characterId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const fields = {
      name: formValues.name,
      role: formValues.role,
      public_description: formValues.description,
      private_description: formValues.privateDescription,
      money: parseInt(formValues.money, 10),
      links: BaseCharacterEditController.#linksPayload(formValues.links),
    };

    if (this.routeSegment === 'npcs') {
      fields.allegiance = formValues.allegiance;
      fields.public_allegiance = formValues.publicAllegiance;
    }

    return this.handleSubmit(gameSlug, characterId, fields, setters);
  }

  /**
   * Apply a loaded character to the edit page, either redirecting away
   * (when the character is not editable) or seeding the form fields.
   *
   * @param {object|null} character - Loaded character, or null while still loading.
   * @param {string} gameSlug - Game slug, used to build the redirect hash.
   * @param {string|number} characterId - Character id, used to build the redirect hash.
   * @param {{setName: Function, setRole: Function, setDescription: Function,
   *   setPrivateDescription: Function, setMoney: Function, setAllegiance: Function,
   *   setPublicAllegiance: Function, setLinks: Function}} setters - Form field setters.
   * @returns {void}
   */
  applyLoadedCharacter(character, gameSlug, characterId, setters) {
    if (BaseCharacterEditController.#shouldRedirect(character)) {
      this.#redirectToShow(gameSlug, characterId);
      return;
    }

    if (!character) {
      return;
    }

    const fields = BaseCharacterEditController.#fieldsFromCharacter(character);

    setters.setName(fields.name);
    setters.setRole(fields.role);
    setters.setDescription(fields.public_description);
    setters.setPrivateDescription(fields.private_description);
    setters.setMoney(fields.money);
    setters.setAllegiance(fields.allegiance);
    setters.setPublicAllegiance(fields.public_allegiance);
    setters.setLinks(fields.links);
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
