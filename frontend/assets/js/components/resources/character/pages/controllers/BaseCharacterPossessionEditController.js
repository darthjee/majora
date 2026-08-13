import GenericClient from '../../../../../client/GenericClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Base controller for the PC/NPC possession edit pages (issue #1076), shared by
 * `PcCharacterPossessionEditController` and `NpcCharacterPossessionEditController` via the
 * `characterKind` constructor argument. Unlike `BaseCharacterItemEditController` (which edits the
 * `CharacterItem`'s own override fields), this controller's form acts directly on the underlying
 * `GamePossession` — `CharacterPossession` is a thin join with no override fields of its own (see
 * the main plan's "Attribute delegation model").
 *
 * @description Loading is a two-step lookup: first resolves the `CharacterPossession` through
 *   `RequestStore.ensure({resource: 'possession', quantityType: 'single', params: {gameSlug, kind:
 *   characterKind, id: characterId, possessionId}})` (the character-scoped detail endpoint) to
 *   read its `game_possession_id`, then fetches the full `GamePossession` itself through
 *   `RequestStore.ensure({resource: 'possession', quantityType: 'single', params: {gameSlug, kind:
 *   'game', id: gamePossessionId}})` — mirroring `GamePossessionEditController`'s own load
 *   exactly, gated by the requester's *game-level* edit permission, not a character-level one.
 *   Submitting PATCHes `.../possessions/:game_possession_id.json` directly (`kind` omitted —
 *   `PATCH.single` is unconditionally game-owned, see `possessionConfig.js`), then redirects to
 *   the possession's character-scoped detail page on success.
 */
export default class BaseCharacterPossessionEditController extends BasePageController {
  /**
   * Extract the game slug, character id, and `CharacterPossession` id from a character possession
   * edit hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string, id: string}} Route params.
   */
  static getParamsFromHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/possessions/:id/edit`,
      hash,
      ['game_slug', 'character_id', 'id'],
    );
  }

  /**
   * Create a base character possession edit controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {Function} setPossession - Possession setter (receives the `GamePossession` data,
   *   merged with its own `game_possession_id`).
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(characterKind, setPossession, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super();
    this.characterKind = characterKind;
    this.setPossession = setPossession;
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
      const params = BaseCharacterPossessionEditController.getParamsFromHash(
        this.characterKind, this.client.currentHash(),
      );

      if (!params.game_slug || !params.character_id || !params.id) {
        safeSet(this.setError, 'Unable to load possession.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadCharacterPossession(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Apply a loaded possession's fields to the edit form's state.
   *
   * @param {object|null} possession - Loaded `GamePossession` data, or null while still loading.
   * @param {{setName: Function, setDescription: Function, setHidden: Function}} setters - Form
   *   field setters.
   * @returns {void}
   */
  applyLoadedItem(possession, setters) {
    if (!possession) {
      return;
    }

    setters.setName(possession.name);
    setters.setDescription(possession.description ?? '');
    setters.setHidden(Boolean(possession.hidden));
  }

  /**
   * Submit a partial update for the underlying `GamePossession`.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request through {@link RequestStore.mutate} (so the possession's cached `GET` data is
   *   purged on success) against the `GamePossession`'s own id, then redirects to the possession's
   *   character-scoped detail page on success, sets field errors on 400, or sets error status on
   *   other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {string|number} characterPossessionId - `CharacterPossession` id (redirect target).
   * @param {string|number} gamePossessionId - Underlying `GamePossession` id (PATCH target).
   * @param {{name: string, description: string, hidden: boolean}} formValues - Raw form field
   *   values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, characterId, characterPossessionId, gamePossessionId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'BaseCharacterPossessionEditController',
        resource: 'possession',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug, id: gamePossessionId },
        body: {
          name: formValues.name,
          description: formValues.description,
          hidden: formValues.hidden,
        },
      });

      await this.#handleResponse(response, gameSlug, characterId, characterPossessionId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #loadCharacterPossession(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'BaseCharacterPossessionEditController',
      resource: 'possession',
      quantityType: 'single',
      params: {
        gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id, possessionId: params.id,
      },
    })
      .then(({ data }) => this.#loadGamePossession(params.game_slug, data.game_possession_id, safeSet))
      .catch(() => {
        safeSet(this.setError, 'Unable to load possession.');
        safeSet(this.setLoading, false);
      });
  }

  #loadGamePossession(gameSlug, gamePossessionId, safeSet) {
    return RequestStore.ensure({
      componentName: 'BaseCharacterPossessionEditController',
      resource: 'possession',
      quantityType: 'single',
      params: { gameSlug, kind: 'game', id: gamePossessionId },
    })
      .then(({ data }) => safeSet(this.setPossession, { ...data, game_possession_id: gamePossessionId }))
      .catch(() => safeSet(this.setError, 'Unable to load possession.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, characterId, characterPossessionId, setters) {
    if (response.ok) {
      this.redirectTo(`/games/${gameSlug}/${this.characterKind}/${characterId}/possessions/${characterPossessionId}`);
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
