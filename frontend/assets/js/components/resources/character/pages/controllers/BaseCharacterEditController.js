import CharacterClient from '../../../../../client/CharacterClient.js';
import GenericClient from '../../../../../client/GenericClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import CharacterEditFieldsBuilder from './CharacterEditFieldsBuilder.js';

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
   * page, because it is missing or not editable. Only acts once the real
   * access/permissions check has resolved (`character.access_resolved`),
   * so a fail-closed `can_edit: false` produced while the real fetch is
   * still in flight does not trigger a premature redirect. A player of the
   * game (`character.is_player`) is also allowed to stay on the page even
   * without `can_edit`, so they can reach the narrower player-editable form
   * (NPCs only in practice, gated separately in {@link submitForm}).
   *
   * @param {object|null} character - Loaded character, or null while still loading.
   * @returns {boolean} True when the page should redirect away.
   */
  static #shouldRedirect(character) {
    return Boolean(character) && character.access_resolved
      && !character.can_edit && !character.is_player;
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
   * Submit a partial update for the character, either through the
   * (dm/admin-only) full endpoint (`isFullEditor` true, the default) or,
   * for a player-only NPC editor, through the narrower player-writable NPC
   * endpoint (`isFullEditor` false).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {object} fields - Fields to update — the full set (`name`, `role`,
   *   `public_description`, `private_description`, `money`, `links`, and, for NPCs,
   *   `allegiance`/`public_allegiance`/`public_slain`) for a full editor, or the reduced
   *   set (`public_description`, `allegiance`, `links`, `slain`) for a player-only editor.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @param {boolean} [isFullEditor] - Whether to PATCH the full (dm/admin) endpoint via
   *   {@link CharacterClient#updateCharacter} (`true`, the default) or the narrower
   *   player-writable NPC endpoint via {@link CharacterClient#updateNpcAsPlayer} (`false`).
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleSubmit(gameSlug, characterId, fields, setters, isFullEditor = true) {
    const token = AuthStorage.getToken();
    const request = isFullEditor
      ? this.characterClient.updateCharacter(this.routeSegment, gameSlug, characterId, token, fields)
      : this.characterClient.updateNpcAsPlayer(gameSlug, characterId, token, fields);

    try {
      const response = await request;

      await this.#handleResponse(response, gameSlug, characterId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Handle the edit form submission: prevent the default browser submit,
   * reset the page status/errors, build the fields payload appropriate for
   * the current viewer's editor kind, and delegate to
   * {@link BaseCharacterEditController#handleSubmit}. A full (dm/admin)
   * editor gets the full fields object PATCHed to `full.json`, unchanged; a
   * player-only NPC editor (`is_player && !can_edit`, NPCs only — gated on
   * `routeSegment === 'npcs'`) gets a reduced fields object PATCHed to the
   * narrower player-writable NPC endpoint instead.
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {{name: string, role: string, description: string,
   *   privateDescription: string, money: string, allegiance: string,
   *   publicAllegiance: string, publicSlain: boolean, links: object[]}} formValues - Raw form
   *   field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @param {boolean} [isFullEditor] - Whether the current viewer is a full (dm/admin)
   *   editor (`character.can_edit`). Defaults to `true`, matching the pre-existing,
   *   dm/admin-only behavior for callers that do not pass this flag.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, characterId, formValues, setters, isFullEditor = true) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const usePlayerEndpoint = this.routeSegment === 'npcs' && !isFullEditor;
    const fields = usePlayerEndpoint
      ? CharacterEditFieldsBuilder.playerFields(formValues)
      : CharacterEditFieldsBuilder.fullEditorFields(formValues, this.routeSegment);

    return this.handleSubmit(gameSlug, characterId, fields, setters, !usePlayerEndpoint);
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
   *   setPublicAllegiance: Function, setPublicSlain: Function,
   *   setLinks: Function}} setters - Form field setters.
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

    const fields = CharacterEditFieldsBuilder.fieldsFromCharacter(character);

    setters.setName(fields.name);
    setters.setRole(fields.role);
    setters.setDescription(fields.public_description);
    setters.setPrivateDescription(fields.private_description);
    setters.setMoney(fields.money);
    setters.setAllegiance(fields.allegiance);
    setters.setPublicAllegiance(fields.public_allegiance);
    setters.setPublicSlain(fields.public_slain);
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
